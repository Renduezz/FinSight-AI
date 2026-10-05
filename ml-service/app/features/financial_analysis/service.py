

import pandas as pd
from app.features.financial_analysis.schemas import (
    FinancialSummaryResponse,
    CategoryBreakdown,
    MonthlyCashflow,
)


def _category_breakdown(df: pd.DataFrame, tx_type: str) -> list[CategoryBreakdown]:

    subset = df[df["type"] == tx_type]
    if subset.empty:
        return []

    totals_by_category = subset.groupby("category")["amount"].sum().sort_values(ascending=False)
    grand_total = totals_by_category.sum()

    return [
        CategoryBreakdown(
            category=category,
            total=round(float(total), 2),
            percentage=round(float(total / grand_total * 100), 2),
        )
        for category, total in totals_by_category.items()
    ]


def _monthly_cashflow(df: pd.DataFrame) -> list[MonthlyCashflow]:

    df = df.copy()
    df["month"] = df["transaction_date"].dt.strftime("%Y-%m")

    # pivot_table reorganiza los datos: una fila por mes, una columna
    # por tipo (INCOME/EXPENSE), con la suma de amount en cada celda.
    pivot = df.pivot_table(
        index="month", columns="type", values="amount", aggfunc="sum", fill_value=0.0
    )

    # Si en el CSV nunca apareció algún tipo (ej. ninguna fila EXPENSE),
    # pivot_table simplemente no crea esa columna. Nos asegura que
    # ambas columnas existan, para no romper el acceso más abajo.
    for required_col in ("INCOME", "EXPENSE"):
        if required_col not in pivot.columns:
            pivot[required_col] = 0.0

    pivot = pivot.sort_index()  # orden cronológico ascendente, ya que "YYYY-MM" ordena bien como texto

    return [
        MonthlyCashflow(
            month=month,
            income=round(float(row["INCOME"]), 2),
            expense=round(float(row["EXPENSE"]), 2),
            net=round(float(row["INCOME"] - row["EXPENSE"]), 2),
        )
        for month, row in pivot.iterrows()
    ]


def build_financial_summary(df: pd.DataFrame, company_id: int | None) -> FinancialSummaryResponse:
    """Punto de entrada principal de este módulo, llamado desde controller.py."""

    total_income = float(df[df["type"] == "INCOME"]["amount"].sum())
    total_expense = float(df[df["type"] == "EXPENSE"]["amount"].sum())

    return FinancialSummaryResponse(
        company_id=company_id,
        period_start=df["transaction_date"].min().date(),
        period_end=df["transaction_date"].max().date(),
        total_income=round(total_income, 2),
        total_expense=round(total_expense, 2),
        net_profit=round(total_income - total_expense, 2),
        transaction_count=len(df),
        income_by_category=_category_breakdown(df, "INCOME"),
        expenses_by_category=_category_breakdown(df, "EXPENSE"),
        monthly_cashflow=_monthly_cashflow(df),
    )
