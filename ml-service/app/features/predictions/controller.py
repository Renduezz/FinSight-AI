from fastapi import APIRouter
from app.features.predictions.schemas import PredictionRequest, PredictionResponse
from app.features.predictions.service import generate_prediction

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.post("/predict", response_model=PredictionResponse)
def predict_risk(payload: PredictionRequest) -> PredictionResponse:
    return generate_prediction(payload)