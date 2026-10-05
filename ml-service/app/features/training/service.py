

import joblib
import pandas as pd

from app.core.config import settings
from app.features.training.schemas import TrainingRequest, TrainingResponse
from app.features.training.trainer import train_gradient_boosting
from app.features.predictions.model_loader import _model_cache
from app.utils.preprocessing import build_feature_vector


def _build_training_dataset(request: TrainingRequest) -> tuple[pd.DataFrame, pd.Series]:

    feature_rows = []
    labels = []

    for sample in request.samples:
        feature_row = build_feature_vector(sample.transactions)
        feature_rows.append(feature_row)
        labels.append(sample.label)

    X = pd.concat(feature_rows, ignore_index=True)
    y = pd.Series(labels, name="label")

    return X, y


def _resolve_output_path(company_id: int | None) -> str:

    filename = f"{company_id}.pkl" if company_id is not None else settings.DEFAULT_MODEL_NAME
    settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
    return settings.MODELS_DIR / filename


def train_model(request: TrainingRequest) -> TrainingResponse:

    X, y = _build_training_dataset(request)

    model, metrics = train_gradient_boosting(X, y)

    output_path = _resolve_output_path(request.company_id)
    joblib.dump(model, output_path)

    # Invalidamos el cache de model_loader para que /predict use el
    # modelo NUEVO de inmediato, no uno viejo en memoria.
    #
    # Ojo con un detalle sutil: model_loader.py cachea el modelo default
    # bajo la clave de CADA empresa que hizo fallback a él (ver
    # model_loader._resolve_model_path). Por eso, si lo que se reentrenó
    # es el modelo default (company_id is None), no basta con borrar una
    # sola clave: hay que limpiar TODO el cache, porque no sabemos cuáles
    # empresas venían usando ese default como respaldo.
    if request.company_id is not None:
        _model_cache.pop(str(request.company_id), None)
    else:
        _model_cache.clear()

    model_version = (
        f"gb_v1_company_{request.company_id}"
        if request.company_id is not None
        else "gb_v1_default"
    )

    return TrainingResponse(
        model_version=model_version,
        company_id=request.company_id,
        n_samples=metrics["n_samples"],
        train_accuracy=metrics["train_accuracy"],
        test_accuracy=metrics["test_accuracy"],
        feature_importances=metrics["feature_importances"],
        trained_at=metrics["trained_at"],
    )
