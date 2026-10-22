package com.finsight.finsight_api.prediction;

public interface PredictionService {

    /** Builds the payload from the company's transactions, calls the ML service and stores the result. */
    PredictionDto generate(Long companyId);

    /** Most recent stored prediction of the company. */
    PredictionDto latest(Long companyId);

    /** A stored prediction with its SHAP explanation. */
    PredictionDto shap(Long companyId, Long predictionId);
}