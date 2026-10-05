
import io
import pandas as pd
from app.core.exceptions import InvalidTransactionDataError

REQUIRED_COLUMNS = {"type", "category", "amount", "transaction_date"}
VALID_TYPES = {"INCOME", "EXPENSE"}


def parse_csv_bytes(file_bytes: bytes) -> pd.DataFrame:

    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as exc:
        raise InvalidTransactionDataError(
            f"No se pudo leer el archivo como CSV válido: {exc}"
        ) from exc

    if df.empty:
        raise InvalidTransactionDataError("El archivo CSV está vacío")

    # --- Validar que existan las columnas obligatorias ---
    missing_columns = REQUIRED_COLUMNS - set(df.columns)
    if missing_columns:
        raise InvalidTransactionDataError(
            f"Al CSV le faltan las columnas obligatorias: {sorted(missing_columns)}. "
            f"Columnas encontradas: {list(df.columns)}"
        )

    # --- Validar los valores de la columna `type` ---
    df["type"] = df["type"].astype(str).str.strip().str.upper()
    invalid_types = set(df["type"].unique()) - VALID_TYPES
    if invalid_types:
        raise InvalidTransactionDataError(
            f"La columna 'type' contiene valores no permitidos: {sorted(invalid_types)}. "
            f"Valores válidos: {sorted(VALID_TYPES)}"
        )

    # --- Validar y convertir `amount` a numérico ---
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    if df["amount"].isna().any():
        filas_invalidas = df[df["amount"].isna()].index.tolist()
        raise InvalidTransactionDataError(
            f"La columna 'amount' tiene valores no numéricos en las filas: {filas_invalidas}"
        )
    if (df["amount"] <= 0).any():
        raise InvalidTransactionDataError(
            "Todos los montos en 'amount' deben ser mayores a cero"
        )

    # --- Validar y convertir `transaction_date` ---
    df["transaction_date"] = pd.to_datetime(df["transaction_date"], errors="coerce")
    if df["transaction_date"].isna().any():
        filas_invalidas = df[df["transaction_date"].isna()].index.tolist()
        raise InvalidTransactionDataError(
            f"La columna 'transaction_date' tiene fechas inválidas o mal formateadas "
            f"en las filas: {filas_invalidas}. Formato esperado: YYYY-MM-DD"
        )

    # `description` es opcional: si no viene en el CSV, se crea vacía
    # para que el resto del código no tenga que preguntarse si existe.
    if "description" not in df.columns:
        df["description"] = ""

    return df
