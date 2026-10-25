package com.finsight.finsight_api.prediction;

import java.math.BigDecimal;
import java.util.List;

/**
 * Optional body of POST /predictions/generate/{companyId}.
 * When it carries transactions, only those are analyzed (the files the user
 * selected). When it is missing or empty, every stored transaction is used.
 */
public record PredictionGenerateRequest(List<Item> transactions) {

    public record Item(
            String type,          // INCOME | EXPENSE
            String category,
            BigDecimal amount,
            String date           // YYYY-MM-DD
    ) {
    }
}
