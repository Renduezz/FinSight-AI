package com.finsight.finsight_api.prediction;

import com.finsight.finsight_api.company.Company;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "predictions", indexes = {
        @Index(name = "idx_predictions_company", columnList = "company_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false, foreignKey = @ForeignKey(name = "fk_predictions_companies"))
    private Company company;

    @NotNull
    @DecimalMin(value = "0.0000")
    @DecimalMax(value = "1.0000")
    @Column(name = "risk_score", nullable = false, precision = 5, scale = 4)
    private BigDecimal riskScore;

    /** Label returned by the ML service. Nullable so ddl-auto=update can add the column to existing rows. */
    @Column(name = "risk_level", length = 20)
    private String riskLevel;

    @Column(name = "cashflow_projection", precision = 15, scale = 2)
    private BigDecimal cashflowProjection;

    /** SHAP factors as a JSON array: [{"feature": "...", "impact": 0.0, "value": 0.0}, ...] */
    @Column(name = "shap_explanation", columnDefinition = "TEXT")
    private String shapExplanation;

    @Column(name = "prediction_date", nullable = false)
    private LocalDateTime predictionDate;

    @Column(name = "model_version", length = 50)
    private String modelVersion;

    /** "improving" | "worsening" | "stable", calculado a partir de la trayectoria real de las transacciones. */
    @Column(name = "trend", length = 20)
    private String trend;

    @Column(name = "projected_cashflow_30d", precision = 15, scale = 2)
    private BigDecimal projectedCashflow30d;

    @Column(name = "projected_cashflow_90d", precision = 15, scale = 2)
    private BigDecimal projectedCashflow90d;

    /** Nulo si la tendencia no es negativa (no hay fecha de quiebre que proyectar). */
    @Column(name = "estimated_days_to_depletion")
    private Integer estimatedDaysToDepletion;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
