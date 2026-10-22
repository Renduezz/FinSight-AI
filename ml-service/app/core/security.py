import secrets
from fastapi import Header
from app.core.config import settings
from app.core.exceptions import UnauthorizedError


def verify_api_key(x_api_key: str | None = Header(default=None)) -> None:
    # Modo desarrollo: si no hay clave configurada, no se exige nada.
    if not settings.ML_API_KEY:
        return

    # Si no llegó el header, o no coincide con la clave configurada, se rechaza.
    if x_api_key is None or not secrets.compare_digest(
        x_api_key.encode(), settings.ML_API_KEY.encode()
    ):
        raise UnauthorizedError("API key inválida o ausente")