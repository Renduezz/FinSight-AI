
from pydantic import BaseModel, Field
from datetime import date
from typing import Optional


class CategoryBreakdown(BaseModel):
    """Una fila del gráfico de 'Gastos por Categoría' (o ingresos por categoría)."""
    category: str
    total: float
    percentage: float = Field(..., ge=0, le=100, description="% respecto al total de su tipo (ingreso o gasto)")


class MonthlyCashflow(BaseModel):
    """Un punto del gráfico de 'Flujo de Caja Mensual' que aparece en el dashboard."""
    month: str = Field(..., description="Formato 'YYYY-MM', ej: '2026-08'")
    income: float
    expense: float
    net: float = Field(..., description="income - expense de ese mes")


class FinancialSummaryResponse(BaseModel):

    company_id: Optional[int] = None
    period_start: date
    period_end: date
    total_income: float
    total_expense: float
    net_profit: float = Field(..., description="total_income - total_expense")
    transaction_count: int

    income_by_category: list[CategoryBreakdown]
    expenses_by_category: list[CategoryBreakdown]
    monthly_cashflow: list[MonthlyCashflow]
