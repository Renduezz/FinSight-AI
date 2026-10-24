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


# Umbral mínimo (en valor absoluto) para considerar que el balance cambia
# "por día" de forma relevante. Por debajo de esto se reporta como "stable"
# en vez de un falso positivo de mejora/deterioro causado por ruido.
MIN_DAILY_SLOPE_FOR_TREND = 1.0


def compute_trend_projection(transactions: list[TransactionItem]) -> dict:
    """
    A diferencia de build_feature_vector (que resume TODO el periodo en una
    sola foto), esto mira la serie temporal real: balance acumulado día a
    día, y le ajusta una recta (regresión lineal simple) para poder
    proyectar hacia adelante. Así es como el análisis deja de ser estático
    y responde de verdad a la trayectoria de cada empresa:
      - si la pendiente es positiva: la empresa va mejorando -> proyección a 30/90 días.
      - si es negativa: va empeorando -> se estima en cuántos días se queda sin fondos.
      - si es ~0: el balance se mantiene estable.
    """
    df = transactions_to_dataframe(transactions)

    df["signed_amount"] = np.where(
        df["type"] == TransactionType.INCOME.value, df["amount"], -df["amount"]
    )

    daily = df.groupby("transaction_date")["signed_amount"].sum().sort_index()
    cumulative_balance = daily.cumsum()

    current_balance = float(cumulative_balance.iloc[-1])

    if len(cumulative_balance) < 2:
        # Solo hay movimientos en una fecha: no hay suficiente historia
        # para estimar una tendencia real, así que no inventamos una.
        return {
            "trend": "stable",
            "projected_cashflow_30d": round(current_balance, 2),
            "projected_cashflow_90d": round(current_balance, 2),
            "estimated_days_to_depletion": None,
        }

    first_day = cumulative_balance.index.min()
    days_elapsed = (cumulative_balance.index - first_day).days.to_numpy(dtype=float)
    balances = cumulative_balance.to_numpy(dtype=float)

    # Pendiente = cuánto cambia el balance acumulado, en promedio, por día.
    slope_per_day, _intercept = np.polyfit(days_elapsed, balances, 1)

    if abs(slope_per_day) < MIN_DAILY_SLOPE_FOR_TREND:
        trend = "stable"
    elif slope_per_day > 0:
        trend = "improving"
    else:
        trend = "worsening"

    projected_30d = current_balance + slope_per_day * 30
    projected_90d = current_balance + slope_per_day * 90

    estimated_days_to_depletion = None
    if trend == "worsening" and current_balance > 0:
        estimated_days_to_depletion = int(current_balance / (-slope_per_day))
    elif trend == "worsening" and current_balance <= 0:
        # Ya está en terreno negativo con tendencia a seguir empeorando.
        estimated_days_to_depletion = 0

    return {
        "trend": trend,
        "projected_cashflow_30d": round(float(projected_30d), 2),
        "projected_cashflow_90d": round(float(projected_90d), 2),
        "estimated_days_to_depletion": estimated_days_to_depletion,
    }

