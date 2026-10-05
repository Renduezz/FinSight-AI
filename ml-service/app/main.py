

from fastapi import FastAPI
from app.core.config import settings
from app.core.exceptions import (
    ModelNotFoundError,
    InvalidTransactionDataError,
    PredictionError,
    model_not_found_handler,
    invalid_data_handler,
    prediction_error_handler,
)
from app.features.predictions.controller import router as predictions_router
from app.features.training.controller import router as training_router
from app.features.financial_analysis.controller import router as financial_analysis_router
from app.features.health.controller import router as health_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Microservicio de analítica predictiva e IA explicable para FinSight AI",
)

# --- Registro de routers ---
# Todo lo definido en predictions/controller.py quedará bajo /api/v1/predictions/*
app.include_router(predictions_router, prefix="/api/v1")
app.include_router(training_router, prefix="/api/v1")
app.include_router(financial_analysis_router, prefix="/api/v1")
app.include_router(health_router, prefix="/api/v1")

# --- Registro de manejadores de excepciones ---
# Esto conecta las excepciones de negocio (core/exceptions.py) con
# respuestas HTTP concretas, sin que controller.py tenga que hacer
# try/except manualmente en cada endpoint.
app.add_exception_handler(ModelNotFoundError, model_not_found_handler)
app.add_exception_handler(InvalidTransactionDataError, invalid_data_handler)
app.add_exception_handler(PredictionError, prediction_error_handler)
