package com.finsight.finsight_api.prediction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {

    Optional<Prediction> findFirstByCompanyIdOrderByPredictionDateDesc(Long companyId);

    Optional<Prediction> findByIdAndCompanyId(Long id, Long companyId);

    List<Prediction> findTop10ByCompanyIdOrderByPredictionDateDesc(Long companyId);
}