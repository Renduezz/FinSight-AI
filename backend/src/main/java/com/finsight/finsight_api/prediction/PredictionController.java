package com.finsight.finsight_api.prediction;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/predictions")
@RequiredArgsConstructor
public class PredictionController {

    private final PredictionService predictionService;

    @PostMapping("/generate/{companyId}")
    public ResponseEntity<PredictionDto> generate(
            @PathVariable Long companyId,
            @RequestBody(required = false) PredictionGenerateRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(predictionService.generate(companyId, body));
    }

    @GetMapping("/latest/{companyId}")
    public ResponseEntity<PredictionDto> latest(@PathVariable Long companyId) {
        return ResponseEntity.ok(predictionService.latest(companyId));
    }

    @GetMapping("/shap/{companyId}/{predictionId}")
    public ResponseEntity<PredictionDto> shap(@PathVariable Long companyId, @PathVariable Long predictionId) {
        return ResponseEntity.ok(predictionService.shap(companyId, predictionId));
    }

    @GetMapping("/history/{companyId}")
    public ResponseEntity<java.util.List<PredictionDto>> history(@PathVariable Long companyId) {
        return ResponseEntity.ok(predictionService.history(companyId));
    }
}
