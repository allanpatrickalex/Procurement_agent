"""Pydantic schemas for validating Gemini agent outputs."""
from typing import List, Optional
from pydantic import BaseModel, Field


# ── Supplier Analysis ──────────────────────────────────────────────────────────

class SupplierScoreModel(BaseModel):
    supplier_name: str
    score: float
    rank: int
    highlights: List[str] = Field(default_factory=list)


class SupplierAnalysisModel(BaseModel):
    recommended_supplier: str
    supplier_scores: List[SupplierScoreModel]
    reasoning: str
    executive_summary: str


# ── Contract Review ────────────────────────────────────────────────────────────

class ContractRiskModel(BaseModel):
    category: str
    description: str
    severity: str


class ContractKeyDatesModel(BaseModel):
    effective_date: Optional[str] = None
    expiry_date: Optional[str] = None
    renewal_date: Optional[str] = None
    auto_renewal: Optional[bool] = False
    notice_period_days: Optional[int] = None
    term_length_months: Optional[int] = None
    price_escalation_percent: Optional[float] = None


class ContractReviewModel(BaseModel):
    executive_summary: str
    risk_level: str
    risks: List[ContractRiskModel]
    recommendations: List[str]
    key_dates: Optional[ContractKeyDatesModel] = None


# ── Spend Analysis ─────────────────────────────────────────────────────────────

class SavingsOpportunityModel(BaseModel):
    category: str
    description: str
    estimated_savings: float


class SpendAnalysisModel(BaseModel):
    executive_summary: str
    total_spend: float
    savings_opportunities: List[SavingsOpportunityModel]
    recommendations: List[str]


# ── Negotiation ────────────────────────────────────────────────────────────────

class NegotiationLeverModel(BaseModel):
    lever: str
    description: str
    potential_impact: str
    priority: str


class TargetPriceModel(BaseModel):
    current_value: float = 0
    target_value: float = 0
    reduction_percent: float = 0
    rationale: str = ""


class SupplierEmailModel(BaseModel):
    subject: str
    body: str


class NegotiationModel(BaseModel):
    executive_summary: str
    negotiation_levers: List[NegotiationLeverModel] = Field(default_factory=list)
    target_price: Optional[TargetPriceModel] = None
    batna: str = ""
    opening_position: str = ""
    walk_away_point: str = ""
    supplier_email: Optional[SupplierEmailModel] = None
    key_talking_points: List[str] = Field(default_factory=list)
    red_flags: List[str] = Field(default_factory=list)


# ── RFP Generation ─────────────────────────────────────────────────────────────

class RfpSectionModel(BaseModel):
    title: str
    content: str


class EvaluationCriterionModel(BaseModel):
    criterion: str
    weight_percent: float
    description: str


class RfpTimelineModel(BaseModel):
    milestone: str
    description: str
    weeks_from_now: int


class ScoringMatrixRowModel(BaseModel):
    criterion: str
    excellent: str
    good: str
    acceptable: str
    poor: str


class RfpModel(BaseModel):
    rfp_title: str
    executive_summary: str
    sections: List[RfpSectionModel] = Field(default_factory=list)
    evaluation_criteria: List[EvaluationCriterionModel] = Field(default_factory=list)
    required_documents: List[str] = Field(default_factory=list)
    timeline: List[RfpTimelineModel] = Field(default_factory=list)
    scoring_matrix: List[ScoringMatrixRowModel] = Field(default_factory=list)
