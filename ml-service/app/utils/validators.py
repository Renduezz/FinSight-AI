import pandas as pd
from app.core.config import settings
from app.core.exceptions import InvalidTransactionDataError



def validate_minimum_class_balance(y: pd.Series) -> None:
    proportion_of_ones = y.mean()
    minority_ratio = min(proportion_of_ones, 1 - proportion_of_ones)
    if minority_ratio < settings.MIN_CLASS_RATIO:
        raise InvalidTransactionDataError(f"La proporcion encontrada es de {minority_ratio:.1%}, el minimo exigido es {settings.MIN_CLASS_RATIO:.1%}")

def validate_no_missing_values(X: pd.DataFrame) -> None:
    if X.isna().any().any() :
        columns_with_nan = X.columns[X.isna().any()].tolist()
        raise InvalidTransactionDataError(f"La columna de expense_to_income_ratio contienen valores nulos por posible falta de ingresos o gastos en la empresa.")
                                         