package com.finsight.finsight_api.prediction;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finsight.finsight_api.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class PredictionMapper {

    // Instancia propia: no depende de que Spring tenga un bean de ObjectMapper
    // configurado en el contexto (esta app no lo expone por defecto).
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PredictionDto toDto(Prediction prediction) {
        List<ShapFactorDto> factors = shapFromJson(prediction.getShapExplanation());

        Map<String, Double> shapValues = new LinkedHashMap<>();
        factors.forEach(factor -> shapValues.put(factor.feature(), factor.impact()));

        return new PredictionDto(
                prediction.getId(),
                prediction.getCompany().getId(),
                prediction.getRiskScore(),
                prediction.getRiskLevel(),
                prediction.getCashflowProjection(),
                factors,
                shapValues,
                List.of(),
                prediction.getModelVersion(),
                prediction.getPredictionDate());
    }

    public String shapToJson(List<ShapFactorDto> factors) {
        try {
            return objectMapper.writeValueAsString(factors == null ? List.of() : factors);
        } catch (JsonProcessingException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not serialize the SHAP explanation", e);
        }
    }

    private List<ShapFactorDto> shapFromJson(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<ShapFactorDto>>() {
            });
        } catch (JsonProcessingException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "The stored SHAP explanation is not valid JSON", e);
        }
    }
}