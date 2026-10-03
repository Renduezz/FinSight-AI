"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import DashboardLayout from "@/shared/components/DashboardLayout";
import RiskGauge from "@/features/predictions/components/RiskGauge";
import CashflowForecastCard from "@/features/predictions/components/CashflowForecastCard";
import PredictionsHistoryTable from "@/features/predictions/components/PredictionsHistoryTable";
import { useTransactions } from "@/shared/context/TransactionsContext";
import { useCompany } from "@/shared/context/CompanyContext";
import { runAnalysis, MlAnalysisResult } from "@/features/predictions/services/predictionApi";

export default function PredictionsPage() {
  const { transactions, riskHeuristic } = useTransactions();
  const { activeCompany } = useCompany();
  const hasData = transactions.length > 0;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [realResult, setRealResult] = useState<MlAnalysisResult | null>(null);
  const [serviceError, setServiceError] = useState("");

  async function handleRunAnalysis() {
    if (!activeCompany) return;
    setIsAnalyzing(true);
    setServiceError("");

    try {
      const result = await runAnalysis(activeCompany.id);
      setRealResult(result);
    } catch (err) {
      // Esperado por ahora: el microservicio de Python todavía no existe.
      // Guardamos el motivo para mostrarlo con honestidad, y seguimos
      // usando el heurístico local como respaldo.
      setRealResult(null);
      setServiceError(err instanceof Error ? err.message : "The analysis service is not available.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const displayScore = realResult?.riskScore ?? riskHeuristic.score;

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Predictions</h1>
          <p className="mt-1 text-sm text-slate-500">
            AI-powered risk analysis based on your financial history.
          </p>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing || !activeCompany || !hasData}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {isAnalyzing ? "Analyzing..." : "Run AI Analysis"}
        </button>
      </div>

      {!hasData ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-600">No data yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Upload a CSV file in the Transactions section to generate a prediction.
          </p>
        </div>
      ) : (
        <>
          {realResult ? (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-xs text-green-700">
              Live result from the Machine Learning service.
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
              {serviceError
                ? `Live analysis service unavailable (${serviceError}). Showing a local rule-based estimate instead.`
                : "This is a rule-based estimate (expenses vs. income ratio). Click \"Run AI Analysis\" to try the live Machine Learning service."}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RiskGauge riskScore={displayScore} />
            <CashflowForecastCard
              projectedAmount={`$${Math.round(riskHeuristic.projectedCashflow).toLocaleString()}`}
              period="Next period (estimated)"
            />
          </div>

          <div className="mt-6">
            <PredictionsHistoryTable />
          </div>
        </>
      )}
    </DashboardLayout>
  );
}