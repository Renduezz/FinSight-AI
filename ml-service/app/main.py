from fastapi import FastAPI, Depends
from app.core.security import verify_api_key
from app.core.config import settings
from app.core.exceptions import (
    ModelNotFoundError,
    InvalidTransactionDataError,
    PredictionError,
    UnauthorizedError,
    model_not_found_handler,
    invalid_data_handler,
    prediction_error_handler, unauthorized_handler
)
from app.features.predictions.controller import router as predictions_router
from app.features.training.controller import router as training_router
from app.features.health.controller import router as health_router


app = FastAPI(title=settings.APP_NAME, version= settings.APP_VERSION)

app.include_router(predictions_router, prefix="/api/v1", dependencies=[Depends(verify_api_key)])
app.include_router(training_router, prefix="/api/v1", dependencies=[Depends(verify_api_key)])
app.include_router(health_router, prefix="/api/v1")


app.add_exception_handler(ModelNotFoundError, model_not_found_handler)
app.add_exception_handler(InvalidTransactionDataError, invalid_data_handler)
app.add_exception_handler(PredictionError, prediction_error_handler)
app.add_exception_handler(UnauthorizedError, unauthorized_handler)


# URL de conexion: http://localhost:8000/api/v1/predictions/predict (cambia localhost:8000)

#Rutas
#POST /api/v1/predictions/generate/{companyId}
#GET /api/v1/predictions/latest/{companyId}
#GET /api/v1/predictions/shap/{companyId}/{predictionId}