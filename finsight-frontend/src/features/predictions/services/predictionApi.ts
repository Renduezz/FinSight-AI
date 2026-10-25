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
  // Tendencia real calculada a partir de la trayectoria de las transacciones
  // en el tiempo (no del agregado estático), con proyección a 30/90 días.
  trend: "improving" | "worsening" | "stable" | null;
  projectedCashflow30d: number | null;
  projectedCashflow90d: number | null;
  estimatedDaysToDepletion: number | null;
}

// Generates a new prediction: the backend reads the company's transactions,
// calls the Python ML service and stores the result.
// Si se pasan transacciones, solo se analizan esas (los archivos seleccionados);
// si no, el backend usa todo lo guardado de la empresa.
export interface AnalysisTransaction {
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  date: string;
}

export function runAnalysis(companyId: number, transactions?: AnalysisTransaction[]) {
  return apiFetch<MlAnalysisResult>(`/predictions/generate/${companyId}`, {
    method: "POST",
    body: JSON.stringify({ transactions: transactions ?? [] }),
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

// Up to the 10 most recent predictions of the company, most recent first.
export function getPredictionHistory(companyId: number) {
  return apiFetch<MlAnalysisResult[]>(`/predictions/history/${companyId}`, {
    method: "GET",
  });
}
