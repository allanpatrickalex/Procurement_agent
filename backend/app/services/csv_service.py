"""CSV parsing and spend metrics service."""

import io
import logging
from typing import Any

import pandas as pd

logger = logging.getLogger(__name__)

COLUMN_ALIASES = {
    "vendor": ["vendor", "supplier", "supplier_name", "vendor_name"],
    "category": ["category", "spend_category", "type"],
    "amount": ["amount", "spend", "total", "cost", "value"],
    "date": ["date", "transaction_date", "invoice_date", "posting_date"],
}


class CSVServiceError(Exception):
    """Raised when CSV parsing or spend calculation fails."""


class CSVService:
    """Parse procurement spend CSV files and calculate summary metrics."""

    def calculate_metrics(self, content: bytes, filename: str) -> dict[str, Any]:
        """Parse a CSV file and return spend metrics for AI analysis."""
        if not content:
            raise CSVServiceError(f"CSV file is empty: {filename}")

        if not filename.lower().endswith(".csv"):
            raise CSVServiceError(f"Expected a CSV file, got: {filename}")

        try:
            dataframe = pd.read_csv(io.BytesIO(content))
        except Exception as exc:
            raise CSVServiceError(f"Failed to read CSV file '{filename}': {exc}") from exc

        if dataframe.empty:
            raise CSVServiceError(f"CSV file contains no rows: {filename}")

        normalized = self._normalize_columns(dataframe)
        normalized["amount"] = pd.to_numeric(normalized["amount"], errors="coerce")
        normalized = normalized.dropna(subset=["amount", "vendor", "category"])

        if normalized.empty:
            raise CSVServiceError(
                "CSV must contain valid Vendor, Category, and Amount columns with numeric amounts."
            )

        total_spend = float(normalized["amount"].sum())
        spend_by_vendor = (
            normalized.groupby("vendor")["amount"]
            .sum()
            .sort_values(ascending=False)
            .round(2)
            .to_dict()
        )
        spend_by_category = (
            normalized.groupby("category")["amount"]
            .sum()
            .sort_values(ascending=False)
            .round(2)
            .to_dict()
        )

        top_suppliers = []
        for vendor, amount in spend_by_vendor.items():
            share = (amount / total_spend) * 100 if total_spend else 0.0
            top_suppliers.append(
                {
                    "vendor": str(vendor),
                    "amount": float(round(amount, 2)),
                    "share_percent": float(round(share, 2)),
                }
            )

        top_vendor_share = top_suppliers[0]["share_percent"] if top_suppliers else 0.0
        top_three_share = float(
            round(sum(item["share_percent"] for item in top_suppliers[:3]), 2)
        )

        metrics: dict[str, Any] = {
            "filename": filename,
            "transaction_count": int(len(normalized)),
            "total_spend": float(round(total_spend, 2)),
            "spend_by_vendor": {str(k): float(v) for k, v in spend_by_vendor.items()},
            "spend_by_category": {str(k): float(v) for k, v in spend_by_category.items()},
            "top_suppliers": top_suppliers[:10],
            "spend_concentration": {
                "vendor_count": int(normalized["vendor"].nunique()),
                "category_count": int(normalized["category"].nunique()),
                "top_vendor_share_percent": top_vendor_share,
                "top_3_vendor_share_percent": top_three_share,
            },
        }

        if "date" in normalized.columns and normalized["date"].notna().any():
            parsed_dates = pd.to_datetime(normalized["date"], errors="coerce").dropna()
            if not parsed_dates.empty:
                metrics["date_range"] = {
                    "min": parsed_dates.min().date().isoformat(),
                    "max": parsed_dates.max().date().isoformat(),
                }

        logger.info(
            "Calculated spend metrics for %s: total_spend=%.2f rows=%d",
            filename,
            metrics["total_spend"],
            metrics["transaction_count"],
        )
        return metrics

    def format_metrics_summary(self, metrics: dict[str, Any]) -> str:
        """Format spend metrics as readable text for Gemini."""
        lines = [
            f"Filename: {metrics.get('filename', 'unknown')}",
            f"Transaction Count: {metrics.get('transaction_count', 0)}",
            f"Total Spend: ${metrics.get('total_spend', 0):,.2f}",
            "",
            "Spend by Vendor:",
        ]

        for vendor, amount in metrics.get("spend_by_vendor", {}).items():
            lines.append(f"- {vendor}: ${amount:,.2f}")

        lines.extend(["", "Spend by Category:"])
        for category, amount in metrics.get("spend_by_category", {}).items():
            lines.append(f"- {category}: ${amount:,.2f}")

        lines.extend(["", "Top Suppliers:"])
        for supplier in metrics.get("top_suppliers", []):
            lines.append(
                f"- {supplier['vendor']}: ${supplier['amount']:,.2f} "
                f"({supplier['share_percent']}% of total)"
            )

        concentration = metrics.get("spend_concentration", {})
        lines.extend(
            [
                "",
                "Spend Concentration:",
                f"- Vendor Count: {concentration.get('vendor_count', 0)}",
                f"- Category Count: {concentration.get('category_count', 0)}",
                f"- Top Vendor Share: {concentration.get('top_vendor_share_percent', 0)}%",
                f"- Top 3 Vendor Share: {concentration.get('top_3_vendor_share_percent', 0)}%",
            ]
        )

        date_range = metrics.get("date_range")
        if date_range:
            lines.extend(
                [
                    "",
                    "Date Range:",
                    f"- From: {date_range.get('min')}",
                    f"- To: {date_range.get('max')}",
                ]
            )

        return "\n".join(lines)

    @staticmethod
    def _normalize_columns(dataframe: pd.DataFrame) -> pd.DataFrame:
        rename_map: dict[str, str] = {}
        lower_columns = {col.lower().strip(): col for col in dataframe.columns}

        for canonical, aliases in COLUMN_ALIASES.items():
            for alias in aliases:
                if alias in lower_columns:
                    rename_map[lower_columns[alias]] = canonical
                    break

        missing = [field for field in ("vendor", "category", "amount") if field not in rename_map.values()]
        if missing:
            raise CSVServiceError(
                "CSV must include Vendor, Category, and Amount columns. "
                f"Missing: {', '.join(missing)}"
            )

        normalized = dataframe.rename(columns=rename_map).copy()
        normalized["vendor"] = normalized["vendor"].astype(str).str.strip()
        normalized["category"] = normalized["category"].astype(str).str.strip()

        if "date" in normalized.columns:
            normalized["date"] = normalized["date"].astype(str).str.strip()

        return normalized
