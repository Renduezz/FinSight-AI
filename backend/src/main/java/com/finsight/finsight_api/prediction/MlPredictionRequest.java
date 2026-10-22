package com.finsight.finsight_api.prediction;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;

/**
 * Body sent to the Python ML service (POST /api/v1/predictions/predict).
 * Names are snake_case because that is what its Pydantic schemas declare.
 */
public record MlPredictionRequest(
        @JsonProperty("company_id") Long companyId,
        List<MlTransaction> transactions
) {
    public record MlTransaction(
            String type,                                   // INCOME | EXPENSE
            String category,
            BigDecimal amount,
            @JsonProperty("transaction_date") String transactionDate,   // YYYY-MM-DD
            String description                             // may be null
    ) {
    }
}