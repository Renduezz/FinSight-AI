

from fastapi import APIRouter
from app.features.training.schemas import TrainingRequest, TrainingResponse
from app.features.training.service import train_model

router = APIRouter(prefix="/training", tags=["Training"])


@router.post(
    "/train",
    response_model=TrainingResponse,
    summary="Entrena (o reentrena) el modelo de Gradient Boosting para una empresa o el modelo default",
)
def train(payload: TrainingRequest) -> TrainingResponse:
    return train_model(payload)
