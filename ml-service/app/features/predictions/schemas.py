from pydantic import BaseModel
from datetime import date
from enum import Enum


class TransactionType(str, Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"


class TransactionItem(BaseModel):
    type: TransactionType
    category: str
    amount: float
    date: date
    description: str = ""


class PredictionRequest(BaseModel):
    company_id: int
    transactions: list[TransactionItem]


class ShapFactor(BaseModel):
    feature: str
    impact: float
    value: float


class PredictionResponse(BaseModel):
    company_id: int
    risk_score: float
    risk_level: str
    cashflow_projection: float
    shap_values: dict[str, float]
    generated_alerts: list[str]
    model_version: str