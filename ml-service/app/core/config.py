from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):

    #Nombre del Servicio.
    APP_NAME: str = "FinSight ML Service"


    #Ponemos una version de la aplicación.
    APP_VERSION: str = "0.1.0"

    #Nombre del modelo generico, para cuando una empresa no tiene ningun modelo entrenado.
    DEFAULT_MODEL_NAME: str= "default.pkl"

    #Definimos la ruta de los modelos
    MODELS_DIR: Path = Path(__file__).resolve().parent.parent / "models" / "company_models"

    #establecemos los umbrales de clasificaion de riesgo, legibles por el dashboard
    RISK_THRESHOLD_LOW: float = 0.33
    RISK_THRESHOLD_MEDIUM: float = 0.66

    # Nivel de logging
    LOG_LEVEL: str = "INFO"

settings = Settings()