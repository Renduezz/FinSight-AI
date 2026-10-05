

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

from app.features.predictions.schemas import TransactionItem


class TrainingSample(BaseModel):


    transactions: list[TransactionItem] = Field(..., min_length=1)
    label: int = Field(
        ..., ge=0, le=1,
        description="1 = la empresa incurrió en riesgo financiero, 0 = no",
    )


class TrainingRequest(BaseModel):

    company_id: Optional[int] = Field(None, gt=0)
    samples: list[TrainingSample] = Field(
        ..., min_length=20,
        description="Mínimo 20 muestras históricas para un entrenamiento razonable",
    )

    @field_validator("samples")
    @classmethod
    def must_have_both_classes_represented(cls, v: list[TrainingSample]) -> list[TrainingSample]:
        # Un clasificador no puede aprender nada útil si TODAS las
        # muestras tienen la misma etiqueta (todas 0 o todas 1).
        # Detectarlo aquí, en el schema, da un error 422 claro e
        # inmediato en vez de un fallo confuso dentro de scikit-learn.
        labels = {sample.label for sample in v}
        if len(labels) < 2:
            raise ValueError(
                "Las muestras de entrenamiento deben incluir AMBAS clases "
                "(al menos una muestra con label=0 y una con label=1)"
            )
        return v


class TrainingResponse(BaseModel):

    model_version: str
    company_id: Optional[int]
    n_samples: int
    train_accuracy: float = Field(..., ge=0, le=1)
    test_accuracy: float = Field(..., ge=0, le=1)
    feature_importances: dict[str, float] = Field(
        ..., description="Importancia relativa de cada variable según el modelo entrenado"
    )
    trained_at: datetime
