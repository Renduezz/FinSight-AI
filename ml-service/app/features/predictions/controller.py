from fastapi import APIRouter
from app.features.predictions.schemas import PredictionRequest, PredictionResponse
from app.features.predictions.service import generate_prediction

# Sin prefijo propio aquí: main.py ya monta este router bajo "/api/v1",
# y Java espera exactamente POST /api/v1/predict (ver MlServiceClient.java
# del backend). Si le dejamos un prefijo "/predictions" aquí, la ruta final
# quedaría "/api/v1/predictions/predict" y Java nunca la encontraría.
router = APIRouter(tags=["Predictions"])


@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Genera una predicción de riesgo financiero con explicabilidad SHAP",
)
def predict_risk(payload: PredictionRequest) -> PredictionResponse:
    return generate_prediction(payload)