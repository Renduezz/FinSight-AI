package com.finsight.finsight_api.prediction;

import com.finsight.finsight_api.common.ApiException;
import com.finsight.finsight_api.company.Company;
import com.finsight.finsight_api.company.CompanyRepository;
import com.finsight.finsight_api.transaction.Transaction;
import com.finsight.finsight_api.transaction.TransactionRepository;
import com.finsight.finsight_api.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PredictionServiceImpl implements PredictionService {

    /** Route exposed by the Python service (prefix /api/v1 + router /predictions + route /predict). */
    private static final String ML_PREDICT_PATH = "/api/v1/predictions/predict";

    private final WebClient mlWebClient;
    private final CompanyRepository companyRepository;
    private final TransactionRepository transactionRepository;
    private final PredictionRepository predictionRepository;
    private final PredictionMapper predictionMapper;

    @Override
    public PredictionDto generate(Long companyId) {
        User user = currentUser();
        Company company = findOwnedCompany(companyId, user);

        List<Transaction> transactions =
                transactionRepository.findByCompanyIdAndCompanyUserId(companyId, user.getId());
        if (transactions.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Company " + companyId + " has no transactions. Upload a CSV first.");
        }

        MlPredictionResponse ml = callMlService(toMlRequest(companyId, transactions));

        Prediction prediction = Prediction.builder()
                .company(company)
                .riskScore(ml.riskScore())
                .riskLevel(ml.riskLevel())
                .cashflowProjection(ml.cashflowProjection())
                .shapExplanation(predictionMapper.shapToJson(ml.shapExplanation()))
                .modelVersion(ml.modelVersion())
                .predictionDate(LocalDateTime.now())
                .trend(ml.trend())
                .projectedCashflow30d(ml.projectedCashflow30d())
                .projectedCashflow90d(ml.projectedCashflow90d())
                .estimatedDaysToDepletion(ml.estimatedDaysToDepletion())
                .build();

        return predictionMapper.toDto(predictionRepository.save(prediction));
    }

    @Override
    public PredictionDto latest(Long companyId) {
        findOwnedCompany(companyId, currentUser());

        return predictionRepository.findFirstByCompanyIdOrderByPredictionDateDesc(companyId)
                .map(predictionMapper::toDto)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "Company " + companyId + " has no predictions yet"));
    }

    @Override
    public PredictionDto shap(Long companyId, Long predictionId) {
        findOwnedCompany(companyId, currentUser());

        return predictionRepository.findByIdAndCompanyId(predictionId, companyId)
                .map(predictionMapper::toDto)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "Prediction " + predictionId + " not found for company " + companyId));
    }

    @Override
    public List<PredictionDto> history(Long companyId) {
        findOwnedCompany(companyId, currentUser());

        return predictionRepository.findTop10ByCompanyIdOrderByPredictionDateDesc(companyId).stream()
                .map(predictionMapper::toDto)
                .toList();
    }

    // ---------------------------------------------------------------- helpers

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private Company findOwnedCompany(Long companyId, User user) {
        return companyRepository.findByIdAndUserIdAndActiveTrue(companyId, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "Company " + companyId + " does not exist or does not belong to the current user"));
    }

    private MlPredictionRequest toMlRequest(Long companyId, List<Transaction> transactions) {
        List<MlPredictionRequest.MlTransaction> items = transactions.stream()
                .map(t -> new MlPredictionRequest.MlTransaction(
                        t.getType().name(),
                        t.getCategory(),
                        t.getAmount(),
                        t.getTransactionDate().toString(),   // ISO yyyy-MM-dd
                        t.getDescription()))
                .toList();
        return new MlPredictionRequest(companyId, items);
    }

    private MlPredictionResponse callMlService(MlPredictionRequest request) {
        try {
            MlPredictionResponse response = mlWebClient.post()
                    .uri(ML_PREDICT_PATH)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(MlPredictionResponse.class)
                    .block();

            if (response == null || response.riskScore() == null) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "The prediction service returned an empty response");
            }
            return response;

        } catch (WebClientResponseException e) {
            log.error("ML service answered {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            int status = e.getStatusCode().value();
            if (status == 401) {
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                        "The prediction service rejected our credentials (check the shared API key)", e);
            }
            if (status == 404) {
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                        "The prediction service has no trained model available yet", e);
            }
            throw new ApiException(HttpStatus.BAD_GATEWAY,
                    "The prediction service could not process the request (HTTP " + status + ")", e);

        } catch (WebClientRequestException e) {
            log.error("ML service unreachable: {}", e.getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "The prediction service is unreachable", e);
        }
    }
}
