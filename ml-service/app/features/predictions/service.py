from app.core.config import settings
from app.core.exceptions import PredictionError
from app.features.predictions.schemas import PredictionRequest, PredictionResponse
from app.features.predictions.model_loader import load_model
from app.features.predictions.shap_service import explain_prediction
from app.utils.preprocessing import build_feature_vector


  
def _score_to_risk_level(score: float) -> str:
    """Traduce el número crudo (0 a 1) en una etiqueta legible para el dashboard."""
    if score < settings.RISK_THRESHOLD_LOW:
        return "Bajo"
    elif score < settings.RISK_THRESHOLD_MEDIUM:
        return "Medio"
    else:
        return "Alto"

def _estimate_cashflow_projection(feature_row) -> float:
    net_cashflow = feature_row["net_cashflow"].iloc[0]
    return float(net_cashflow)

def generate_prediction(request: PredictionRequest) -> PredictionResponse:
    feature_row = build_feature_vector(request.transactions)
    model = load_model(request.company_id)
    risk_score = float(model.predict_proba(feature_row)[0][1])



def generate_prediction(request: PredictionRequest) -> PredictionResponse:
    """
    Punto de entrada principal de este módulo, llamado desde controller.py.
    """
    #Feature engineering: transacciones -> vector numérico
    feature_row = build_feature_vector(request.transactions)

    #Cargar el modelo entrenado correspondiente a la empresa
    model = load_model(request.company_id)

    try:
        risk_score = float(model.predict_proba(feature_row)[0][1])
    except Exception as exc:
   
        raise PredictionError(f"Fallo al ejecutar el modelo: {exc}") from exc

    shap_factors = explain_prediction(model, feature_row)
    cashflow_projection = _estimate_cashflow_projection(feature_row)

    return PredictionResponse(
        company_id=request.company_id,
        risk_score=round(risk_score, 4),
        risk_level=_score_to_risk_level(risk_score),
        cashflow_projection=round(cashflow_projection, 2),
        shap_explanation=shap_factors,
        model_version=f"gb_v1_company_{request.company_id}",
    )



