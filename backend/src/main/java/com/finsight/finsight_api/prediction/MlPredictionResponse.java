package com.finsight.finsight_api.prediction;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;

/** Body returned by the Python ML service. */
public record MlPredictionResponse(
        @JsonProperty("company_id") Long companyId,
        @JsonProperty("risk_score") BigDecimal riskScore,
        @JsonProperty("risk_level") String riskLevel,
        @JsonProperty("cashflow_projection") BigDecimal cashflowProjection,
        @JsonProperty("shap_explanation") List<ShapFactorDto> shapExplanation,
        @JsonProperty("model_version") String modelVersion
) {
}