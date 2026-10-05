
import joblib
from pathlib import Path
from app.core.config import settings
from app.core.exceptions import ModelNotFoundError

# Cache en memoria: { "1": <modelo cargado>, "2": <modelo cargado>, ... }
# Es un simple diccionario de proceso; si en el futuro se despliegan
# múltiples instancias del ML Service, considera un cache compartido
# (ej. Redis) en vez de este diccionario local.
_model_cache: dict[str, object] = {}


def _resolve_model_path(company_id: int) -> Path:

    company_specific_path = settings.MODELS_DIR / f"{company_id}.pkl"
    if company_specific_path.exists():
        return company_specific_path

    # Fallback: si la empresa es nueva y aún no tiene modelo propio
    # entrenado con SU historial, se usa un modelo genérico entrenado
    # con datos agregados de varias PYMEs (útil para el "cold start").
    default_path = settings.MODELS_DIR / settings.DEFAULT_MODEL_NAME
    if default_path.exists():
        return default_path

    raise ModelNotFoundError(
        f"No existe modelo específico para la empresa {company_id} "
        f"ni un modelo default en {settings.MODELS_DIR}"
    )


def load_model(company_id: int):

    cache_key = str(company_id)

    if cache_key in _model_cache:
        return _model_cache[cache_key]

    model_path = _resolve_model_path(company_id)

    # joblib.load es la forma estándar de deserializar modelos de
    # scikit-learn guardados con joblib.dump (más eficiente que
    # pickle puro para arrays de numpy grandes).
    model = joblib.load(model_path)

    _model_cache[cache_key] = model
    return model
