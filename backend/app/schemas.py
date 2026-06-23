"""Pydantic schemas for validating Gemini agent outputs."""
from typing import List, Optional
from pydantic import BaseModel, Field


class SupplierScoreModel(BaseModel):
    supplier_name: str
    score: float
    rank: int
    highlights: List[str] = Field(default_factory=list)


class SupplierAnalysisModel(BaseModel):
    recommended_supplier: str
    # Note: using plain List for compatibility across pydantic versions.
    # Add explicit validators if you need to enforce non-empty lists.
    supplier_scores: List[SupplierScoreModel]
    reasoning: str
    executive_summary: str


class ContractRiskModel(BaseModel):
    category: str
    description: str
    severity: str


class ContractReviewModel(BaseModel):
    executive_summary: str
    risk_level: str
    risks: List[ContractRiskModel]
    recommendations: List[str]


class SavingsOpportunityModel(BaseModel):
    category: str
    description: str
    estimated_savings: float


class SpendAnalysisModel(BaseModel):
    executive_summary: str
    total_spend: float
    savings_opportunities: List[SavingsOpportunityModel]
    recommendations: List[str]
