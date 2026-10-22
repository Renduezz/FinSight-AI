import { apiFetch } from "@/shared/lib/apiClient";

export interface ShapFactor {
  feature: string;
  impact: number;
  value: number;
}

export interface MlAnalysisResult {
  id: number;
  companyId: number;
  riskScore: number;
  riskLevel: string;
  cashflowProjection: number | null;
  shapExplanation: ShapFactor[];
  shapValues: Record<string, number>;
  generatedAlerts: string[];
  modelVersion: string | null;
  predictionDate: string;
}

// Generates a new prediction: the backend reads the company's transactions,
// calls the Python ML service and stores the result.
export function runAnalysis(companyId: number) {
  return apiFetch<MlAnalysisResult>(`/predictions/generate/${companyId}`, {
    method: "POST",
  });
}

// Last stored prediction of the company (404 if none exists yet).
export function getLatestPrediction(companyId: number) {
  return apiFetch<MlAnalysisResult>(`/predictions/latest/${companyId}`, {
    method: "GET",
  });
}

// A stored prediction with its SHAP explanation.
export function getPredictionShap(companyId: number, predictionId: number) {
  return apiFetch<MlAnalysisResult>(
    `/predictions/shap/${companyId}/${predictionId}`,
    { method: "GET" },
  );
}