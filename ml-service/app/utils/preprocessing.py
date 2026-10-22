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
    records = [
        {
            "type": t.type.value,
            "category": t.category,
            "amount": t.amount,
            "transaction_date": pd.to_datetime(t.transaction_date),
        }
        for t in transactions
    ]
    return pd.DataFrame(records)


#Funcion principal de Preprocessing
def build_feature_vector(transactions: list[TransactionItem]) -> pd.DataFrame:
      df = transactions_to_dataframe(transactions)

      income_df = df[df["type"] == TransactionType.INCOME.value]
      expense_df = df[df["type"] == TransactionType.EXPENSE.value]

      total_income = income_df["amount"].sum()
      total_expense = expense_df["amount"].sum()
      net_cashflow = total_income - total_expense
      expense_to_income_ratio = total_expense / total_income if total_income > 0 else np.nan

      avg_transaction_amount = df["amount"].mean()
      transaction_count = len(df)
      expense_volatility = expense_df["amount"].std(ddof=0) if len(expense_df) > 1 else 0.0
      income_volatility = income_df["amount"].std(ddof=0) if len(income_df) > 1 else 0.0
  
      if not income_df.empty:
        last_income_date = income_df["transaction_date"].max()
        days_since_last_income = (df["transaction_date"].max() - last_income_date).days
      else:
        days_since_last_income = 999



      #los 9 valores ya estan calculados, ahora con lo siguiente es crear un diccionario de datos con esos valores, 
      # ya que el modelo espera es una tabla con una sola fila, que son los FEATURES_NAMES.

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

    
      return pd.DataFrame([feature_row], columns=FEATURE_NAMES)
      
