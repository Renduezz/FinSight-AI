from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Literal
from app.features.predictions.schemas import TransactionItem

class TrainingSample(BaseModel):
        
    transactions: list[TransactionItem] 
    label: Literal[0, 1] 


class TrainingRequest(BaseModel):
    company_id: int | None = None
    samples: list[TrainingSample] = Field(min_length=20) #el numero 20 puede ser ajustable / recomenbal

    @field_validator("samples")
    @classmethod
    def must_have_both_classes(cls, v: list[TrainingSample]) -> list[TrainingSample]:
        labels = {sample.label for sample in v}
        if len(labels) < 2:
            raise ValueError("Las muestras para el entrenamiento deben contener ambas clases, una muestra con el Label=0 y un con Label =1"
                             )
        return v

class TrainingResponse(BaseModel):
    model_version: str
    company_id: int | None = None
    n_samples: int
    train_accuracy: float = Field(..., ge=0, le=1)
    test_accuracy: float = Field(..., ge=0, le=1)
    feature_importances: dict[str, float] 
    trained_at: datetime