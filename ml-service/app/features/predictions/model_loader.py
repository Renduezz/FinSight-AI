#Imports necesarios para el archivo
import joblib
from pathlib import Path
from app.core.config import settings
from app.core.exceptions import ModelNotFoundError

_model_cache: dict[str, object] = {}

#funcion para verificar si el modelo existe,
def _resolve_model_path(company_id: int) -> Path:
    company_specific_path = settings.MODELS_DIR / f"{company_id}.pkl"
    if company_specific_path.exists():
        return  company_specific_path

    default_path = settings.MODELS_DIR / settings.DEFAULT_MODEL_NAME
    if default_path.exists():
        return  default_path

    raise ModelNotFoundError(f"No existe modelo para la empresa {company_id}")

  
def load_model(company_id: int):
    """
    Punto de entrada público de este módulo.
    Devuelve el objeto del modelo ya deserializado (listo para usar
    con .predict_proba(...) en service.py).
    """
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

def invalidate_cache(company_id: int | None = None) -> None:
    if company_id is not None:
        _model_cache.pop(str(company_id), None)
    else:
        _model_cache.clear()
