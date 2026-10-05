from fastapi import Request
from fastapi.responses import JSONResponse

 #aqui creamos un exepcion personalizada para nuestros propios tipos de errores
class MLServiceError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


#error 404 - indica que el modelo no se encontró
class ModelNotFoundError(MLServiceError):
    pass

#error 422 - indica que los datos recibidos no son correctos
class InvalidTransactionDataError(MLServiceError):
    pass


#error 500 - indicaquehy una falla con el servidor
class PredictionError(MLServiceError):
    pass



# Handlers: funciones que FastAPI ejecuta automáticamente cuando una excepción de estos tipos "escapa" de un endpoint sin ser capturada.


async def model_not_found_handler(request: Request, exc: ModelNotFoundError):
    return JSONResponse(
        status_code=404,
        content={"error": "MODEL_NOT_FOUND", "message": exc.message},
    )


async def invalid_data_handler(request: Request, exc: InvalidTransactionDataError):
    return JSONResponse(
        status_code=422,  # 422 = Unprocessable Entity, estándar para "datos mal formados"
        content={"error": "INVALID_TRANSACTION_DATA", "message": exc.message},
    )


async def prediction_error_handler(request: Request, exc: PredictionError):
    return JSONResponse(
        status_code=500,
        content={"error": "PREDICTION_FAILED", "message": exc.message},
    )