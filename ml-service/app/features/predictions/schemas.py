from pydantic import BaseModel, Field
from datetime import date
from enum import Enum


# Aqui personalizmos el tipo de datos para las transacciones. Enumera las opciones validas para las transacciones, e indicamos que son de tipo cadena de texto.
class TransactionType(str, Enum):
    """Es"""
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"


# esta clase tomm el BaseModel de Pydantuc, que nos permite validar la estructura de los datos que entran, y que sean acordes a los que declarommos
class TransactionItem(BaseModel):
    type: TransactionType
    category: str
    amount: float
    transaction_date: date
    description: str | None = None #para que el backEnd perrmita descripciones nulas.
 

class PredictionRequest(BaseModel):
    company_id: int
    transactions: list[TransactionItem] = Field(min_length=1)
    

#esta clase la utiliza el modulo SHAP para definir el nivel de riesgo
class ShapFactor(BaseModel):
    feature: str
    impact: float
    value: float


class PredictionResponse(BaseModel):
    company_id: int
    risk_score: float
    risk_level: str
    cashflow_projection: float
    shap_explanation: list[ShapFactor]
    model_version: str
    # Proyección real basada en la trayectoria de las transacciones a lo
    # largo del tiempo (no en el agregado estático). Opcionales porque,
    # en teoría, podrían no calcularse si llega una sola transacción.
    trend: str | None = None
    projected_cashflow_30d: float | None = None
    projected_cashflow_90d: float | None = None
    estimated_days_to_depletion: int | None = None


