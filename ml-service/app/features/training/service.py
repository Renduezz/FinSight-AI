import pandas as pd
from app.features.training.schemas import TrainingRequest
from app.utils.preprocessing import build_feature_vector
import joblib
from app.core.config import settings
from app.features.training.schemas import TrainingResponse
from app.features.training.trainer import train_gradient_boosting
from app.features.predictions.model_loader import invalidate_cache


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

def train_model(request: TrainingRequest) -> TrainingResponse:
    X, y = _build_training_dataset(request)
    model, metrics = train_gradient_boosting(X, y)

    filename = f"{request.company_id}.pkl" if request.company_id is not None else settings.DEFAULT_MODEL_NAME
    settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, settings.MODELS_DIR / filename)

    invalidate_cache(request.company_id)

    model_version = (
        f"gb_v1_company_{request.company_id}"
        if request.company_id is not None
        else "gb_v1_default"
    )

    return TrainingResponse(
        model_version=model_version,
        company_id=request.company_id,
        **metrics,
    )
