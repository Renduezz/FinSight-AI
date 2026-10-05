from app.core.config import settings
from app.core.exceptions import PredictionError
from app.features.predictions.schemas import PredictionRequest, PredictionResponse
from app.features.predictions.model_loader import load_model
from app.features.predictions.shap_service import explain_prediction
from app.utils.preprocessing import build_feature_vector


def _score_to_risk_level(score: float) -> str:
    if score < settings.RISK_THRESHOLD_LOW:
        return "LOW"
    elif score < settings.RISK_THRESHOLD_MEDIUM:
        return "MEDIUM"
    return "HIGH"


def _estimate_cashflow_projection(feature_row) -> float:
    net_cashflow = feature_row["net_cashflow"].iloc[0]
    return float(net_cashflow)


def _build_alerts(risk_level: str, top_factor_name: str | None) -> list[str]:
    alerts: list[str] = []
    if risk_level == "HIGH":
        alerts.append("High risk of financial distress detected based on recent transaction patterns.")
    elif risk_level == "MEDIUM":
        alerts.append("Moderate financial risk detected; monitor cash flow closely.")
    else:
        alerts.append("Financial risk is currently low based on the available data.")

    if top_factor_name:
        alerts.append(f"The variable with the largest influence on this result is '{top_factor_name}'.")

    return alerts


def generate_prediction(request: PredictionRequest) -> PredictionResponse:
    feature_row = build_feature_vector(request.transactions)
    model = load_model(request.company_id)

    try:
        risk_score = float(model.predict_proba(feature_row)[0][1])
    except Exception as exc:
        raise PredictionError(f"Fallo al ejecutar el modelo: {exc}") from exc

    risk_level = _score_to_risk_level(risk_score)

    shap_factors = explain_prediction(model, feature_row)
    # Java espera un mapa plano {"nombre_variable": impacto}, no una lista
    # de objetos — lo convertimos aquí, en la frontera entre capas.
    shap_values = {factor.feature: round(factor.impact, 4) for factor in shap_factors}
    top_factor_name = shap_factors[0].feature if shap_factors else None

    cashflow_projection = _estimate_cashflow_projection(feature_row)
    generated_alerts = _build_alerts(risk_level, top_factor_name)

    return PredictionResponse(
        company_id=request.company_id,
        risk_score=round(risk_score, 4),
        risk_level=risk_level,
        cashflow_projection=round(cashflow_projection, 2),
        shap_values=shap_values,
        generated_alerts=generated_alerts,
        model_version=f"gb_v1_company_{request.company_id}",
    )