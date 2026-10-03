import { apiFetch } from "@/shared/lib/apiClient";

export interface MlAnalysisResult {
  riskScore: number;
  riskLevel: string;
  shapValues: Record<string, number>;
  generatedAlerts: string[];
}

export function runAnalysis(companyId: number) {
  return apiFetch<MlAnalysisResult>(`/analytics/analyze/${companyId}`, {
    method: "POST",
  });
}