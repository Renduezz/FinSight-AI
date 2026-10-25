import math

from app.core.config import settings
from app.core.exceptions import PredictionError
from app.features.predictions.schemas import PredictionRequest, PredictionResponse
from app.features.predictions.model_loader import load_model
from app.features.predictions.shap_service import explain_prediction
from app.utils.preprocessing import build_feature_vector, compute_trend_projection


  
def _score_to_risk_level(score: float) -> str:
    """Traduce el número crudo (0 a 1) en una etiqueta legible para el dashboard."""
    if score < settings.RISK_THRESHOLD_LOW:
        return "Bajo"
    elif score < settings.RISK_THRESHOLD_MEDIUM:
        return "Medio"
    else:
        return "Alto"

def _blend_risk(model_score: float, feature_row, trend: str | None) -> float:
    """
    El modelo entrenado casi solo distingue dos extremos (~0 o ~1). Para que el
    riesgo sea gradual y refleje de verdad los datos, lo combinamos (20%) con
    una curva suave basada en la relacion gastos/ingresos (80%), y ajustamos un
    poco segun la tendencia real.
      ratio 0.6 -> ~7%   ratio 1.0 -> 50%   ratio 1.5 -> ~95%
    """
    ratio = float(feature_row["expense_to_income_ratio"].iloc[0])
    if ratio != ratio:  # NaN: no hay ingresos
        ratio = 5.0
    ratio = min(max(ratio, 0.0), 5.0)
    smooth = 1.0 / (1.0 + math.exp(-6.0 * (ratio - 1.0)))
    score = 0.2 * model_score + 0.8 * smooth
    if trend == "worsening":
        score += 0.05
    elif trend == "improving":
        score -= 0.03
    return min(max(score, 0.0), 1.0)


def _estimate_cashflow_projection(feature_row) -> float:
    net_cashflow = feature_row["net_cashflow"].iloc[0]
    return float(net_cashflow)

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
    trend_projection = compute_trend_projection(request.transactions)
    risk_score = _blend_risk(risk_score, feature_row, trend_projection["trend"])

    return PredictionResponse(
        company_id=request.company_id,
        risk_score=round(risk_score, 4),
        risk_level=_score_to_risk_level(risk_score),
        cashflow_projection=round(cashflow_projection, 2),
        shap_explanation=shap_factors,
        model_version=f"gb_v1_company_{request.company_id}",
        trend=trend_projection["trend"],
        projected_cashflow_30d=trend_projection["projected_cashflow_30d"],
        projected_cashflow_90d=trend_projection["projected_cashflow_90d"],
        estimated_days_to_depletion=trend_projection["estimated_days_to_depletion"],
    )



