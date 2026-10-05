"""
utils/preprocessing.py
-------------------------
El modelo de Gradient Boosting NO entiende una lista de transacciones,
entiende un vector de NÚMEROS (features). Esta capa convierte:

    [transacción1, transacción2, ..., transacciónN]  -->  [f1, f2, f3, ..., fk]

Este paso se llama "Feature Engineering" y es probablemente la parte
más importante de tu trabajo de tesis a nivel de ML: la calidad de
estas variables define qué tan bueno es el modelo, más incluso que
el algoritmo elegido.

Mantenemos esto separado en su propio archivo (y no dentro de service.py)
porque:
1. Se puede reutilizar tanto en predicción como en entrenamiento
   (el modelo debe entrenarse y predecir con EXACTAMENTE las mismas
   features, en el mismo orden).
2. Facilita escribir tests unitarios aislados para la lógica de features.
"""

import pandas as pd
import numpy as np
from app.features.predictions.schemas import TransactionItem, TransactionType


# Orden fijo de las columnas del vector de entrada al modelo.
# CRÍTICO: este orden debe ser IDÉNTICO al usado durante el entrenamiento
# (ver features/training/trainer.py). Si training.py cambia este orden,
# hay que reentrenar el modelo o las predicciones quedarán corruptas.
FEATURE_NAMES = [
    "total_income",           # Suma de ingresos en el periodo
    "total_expense",          # Suma de gastos en el periodo
    "net_cashflow",           # total_income - total_expense
    "expense_to_income_ratio",# Qué proporción de lo que entra, se va en gastos
    "avg_transaction_amount", # Tamaño promedio de las transacciones
    "transaction_count",      # Número total de movimientos (actividad de la empresa)
    "expense_volatility",     # Desviación estándar de los gastos (qué tan irregulares son)
    "income_volatility",      # Desviación estándar de los ingresos
    "days_since_last_income", # Días desde el último ingreso registrado
]


def transactions_to_dataframe(transactions: list[TransactionItem]) -> pd.DataFrame:
    """
    Convierte la lista de objetos Pydantic (validados) en un DataFrame
    de pandas, que es más cómodo para hacer cálculos vectorizados.
    """
    records = [
        {
            "type": t.type.value,
            "category": t.category,
            "amount": t.amount,
            "transaction_date": pd.to_datetime(t.date),
        }
        for t in transactions
    ]
    return pd.DataFrame(records)


def build_feature_vector(transactions: list[TransactionItem]) -> pd.DataFrame:
    """
    Función principal: recibe las transacciones crudas y devuelve
    un DataFrame de UNA sola fila con las columnas en FEATURE_NAMES.

    Se devuelve como DataFrame (no como lista/np.array) porque
    scikit-learn conserva mejor el nombre de las columnas, lo cual
    ayuda muchísimo a que SHAP genere explicaciones legibles después.
    """
    df = transactions_to_dataframe(transactions)

    income_df = df[df["type"] == TransactionType.INCOME.value]
    expense_df = df[df["type"] == TransactionType.EXPENSE.value]

    total_income = income_df["amount"].sum()
    total_expense = expense_df["amount"].sum()
    net_cashflow = total_income - total_expense

    # Evitamos división por cero cuando una empresa no tiene ingresos
    # registrados en el periodo (poco común, pero posible con datos reales).
    expense_to_income_ratio = (
        total_expense / total_income if total_income > 0 else np.nan
    )

    avg_transaction_amount = df["amount"].mean()
    transaction_count = len(df)

    # ddof=0 -> desviación estándar poblacional (no muestral), apropiada
    # aquí porque estamos describiendo TODO el historial disponible,
    # no una muestra de un universo más grande.
    expense_volatility = expense_df["amount"].std(ddof=0) if len(expense_df) > 1 else 0.0
    income_volatility = income_df["amount"].std(ddof=0) if len(income_df) > 1 else 0.0

    if not income_df.empty:
        last_income_date = income_df["transaction_date"].max()
        days_since_last_income = (df["transaction_date"].max() - last_income_date).days
    else:
        # Sin ningún ingreso registrado: se marca con un valor alto
        # para que el modelo lo interprete como señal de alerta.
        days_since_last_income = 999

    feature_row = {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_cashflow": net_cashflow,
        "expense_to_income_ratio": expense_to_income_ratio,
        "avg_transaction_amount": avg_transaction_amount,
        "transaction_count": transaction_count,
        "expense_volatility": expense_volatility,
        "income_volatility": income_volatility,
        "days_since_last_income": days_since_last_income,
    }

    # Se construye explícitamente en el orden de FEATURE_NAMES para
    # garantizar consistencia con el modelo entrenado.
    return pd.DataFrame([feature_row], columns=FEATURE_NAMES)
