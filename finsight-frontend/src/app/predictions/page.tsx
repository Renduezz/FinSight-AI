"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import DashboardLayout from "@/shared/components/DashboardLayout";
import RiskGauge from "@/features/predictions/components/RiskGauge";
import CashflowForecastCard from "@/features/predictions/components/CashflowForecastCard";
import PredictionsHistoryTable from "@/features/predictions/components/PredictionsHistoryTable";
import { useTransactions } from "@/shared/context/TransactionsContext";
import { useCompany } from "@/shared/context/CompanyContext";
import { runAnalysis, MlAnalysisResult } from "@/features/predictions/services/predictionApi";
import { useLanguage } from "@/shared/context/LanguageContext";

export default function PredictionsPage() {
  const { transactions, riskHeuristic, selectedTransactions, selectedBatchIds, uploads } = useTransactions();
  const { activeCompany } = useCompany();
  const { t, language } = useLanguage();
  const hasData = transactions.length > 0;
  const es = language === "es";
  const analyzedFiles =
    selectedBatchIds.length === 0
      ? es ? "todos los archivos" : "all files"
      : uploads.filter((u) => selectedBatchIds.includes(u.batchId)).map((u) => u.fileName).join(", ");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [realResult, setRealResult] = useState<MlAnalysisResult | null>(null);
  const [serviceError, setServiceError] = useState("");

  // Si cambias de empresa o de archivos seleccionados, el resultado anterior
  // ya no corresponde: volvemos a la estimación local hasta ejecutar de nuevo.
  const selectionKey = `${activeCompany?.id ?? ""}|${selectedBatchIds.join(",")}`;
  useEffect(() => {
    setRealResult(null);
    setServiceError("");
  }, [selectionKey]);

  async function handleRunAnalysis() {
    if (!activeCompany) return;
    setIsAnalyzing(true);
    setServiceError("");

    try {
      // Solo los archivos seleccionados en Transacciones (vacío = todos).
      const payload = selectedTransactions.map((tx) => ({
        type: (tx.tipo === "INGRESO" ? "INCOME" : "EXPENSE") as "INCOME" | "EXPENSE",
        category: tx.categoria,
        amount: tx.monto,
        date: tx.fecha,
      }));
      const result = await runAnalysis(activeCompany.id, payload);
      setRealResult(result);
    } catch (err) {
      setRealResult(null);
      setServiceError(err instanceof Error ? err.message : t.predictions.unavailable);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const displayScore = realResult?.riskScore ?? riskHeuristic.score;

  // Preferimos la proyección a 30 días calculada con la tendencia real; si no
  // viene, caemos al valor que devuelve el modelo, y por último al heurístico local.
  const projectedValue =
    realResult?.projectedCashflow30d ?? realResult?.cashflowProjection ?? riskHeuristic.projectedCashflow;
  const projectedAmount = `$${Math.round(projectedValue).toLocaleString()}`;

  const projectedPeriod = realResult
    ? t.predictions.nextPeriodModel(realResult.modelVersion ?? "n/a")
    : t.predictions.nextPeriod;

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.predictions.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t.predictions.subtitle}
          </p>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing || !activeCompany || !hasData}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {isAnalyzing ? t.predictions.analyzing : t.predictions.run}
        </button>
      </div>

      {!hasData ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-600">{t.common.noDataYet}</p>
          <p className="mt-1 text-sm text-slate-400">
            {t.predictions.noDataHint}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-3 text-xs text-slate-500">
            {es ? "Se analiza: " : "Analyzing: "}
            <span className="font-medium text-slate-700">{analyzedFiles}</span>
            {es
              ? " (puedes marcar uno o varios archivos en Transacciones)"
              : " (you can tick one or several files in Transactions)"}
          </p>
          {realResult ? (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-xs text-green-700">
              {t.predictions.liveResult}
              {realResult.riskLevel ? t.predictions.riskLevel(realResult.riskLevel) : ""}.
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
              {serviceError
                ? t.predictions.serviceDown(serviceError)
                : t.predictions.ruleBased}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RiskGauge riskScore={displayScore} />
            <CashflowForecastCard
              projectedAmount={projectedAmount}
              period={projectedPeriod}
            />
          </div>

          {realResult?.trend && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-700">
                {t.predictions.trendLabel[realResult.trend] ?? realResult.trend}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {realResult.trend === "worsening" && realResult.estimatedDaysToDepletion === 0
                  ? t.predictions.trendWorseningNegative
                  : realResult.trend === "worsening" && realResult.estimatedDaysToDepletion != null
                  ? t.predictions.trendWorsening(realResult.estimatedDaysToDepletion)
                  : realResult.trend === "improving" && realResult.projectedCashflow90d != null
                  ? t.predictions.trendImproving(
                      `$${Math.round(realResult.projectedCashflow90d).toLocaleString()}`,
                    )
                  : t.predictions.trendStable}
              </p>
            </div>
          )}

          <div className="mt-6">
            <PredictionsHistoryTable companyId={activeCompany?.id ?? null} refreshKey={realResult?.id ?? null} />
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
