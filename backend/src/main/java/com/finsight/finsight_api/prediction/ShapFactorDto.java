package com.finsight.finsight_api.prediction;

/** One SHAP factor: which variable, how much it pushed the risk, and the value it had. */
public record ShapFactorDto(String feature, double impact, double value) {
}