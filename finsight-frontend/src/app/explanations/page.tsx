"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/shared/components/DashboardLayout";
import ShapFactorsList from "@/features/insights/components/ShapFactorsList";
import AlertCard from "@/features/insights/components/AlertCard";
import { useLanguage } from "@/shared/context/LanguageContext";
import { useCompany } from "@/shared/context/CompanyContext";
import { getLatestPrediction, MlAnalysisResult } from "@/features/predictions/services/predictionApi";

type Severity = "ALTA" | "MEDIA" | "BAJA";
interface GeneratedAlert {
  severity: Severity;
  message: string;
}

// A partir del resultado real (SHAP + tendencia) armamos alertas concretas,
// en vez de mostrar siempre el mismo texto fijo. No inventamos nada que el
// modelo no haya calculado: cada alerta sale de un número real de esta
// predicción.
function buildAlerts(result: MlAnalysisResult, t: ReturnType<typeof useLanguage>["t"]): GeneratedAlert[] {
  const alerts: GeneratedAlert[] = [];

  const factors = result.shapExplanation ?? [];
  const topIncreasing = factors.filter((f) => f.impact > 0).sort((a, b) => b.impact - a.impact)[0];
  const topDecreasing = factors.filter((f) => f.impact < 0).sort((a, b) => a.impact - b.impact)[0];

  if (topIncreasing) {
    const label = t.insights.factors[topIncreasing.feature] ?? topIncreasing.feature;
    alerts.push({ severity: "MEDIA", message: t.insights.alertTopFactorUp(label) });
  }

  if (result.trend === "worsening") {
    if (result.estimatedDaysToDepletion === 0) {
      alerts.push({ severity: "ALTA", message: t.insights.alertAlreadyNegative });
    } else if (result.estimatedDaysToDepletion != null) {
      alerts.push({
        severity: result.estimatedDaysToDepletion <= 60 ? "ALTA" : "MEDIA",
        message: t.insights.alertWorsening(result.estimatedDaysToDepletion),
      });
    }
  } else if (result.trend === "improving" && result.projectedCashflow90d != null) {
    alerts.push({
      severity: "BAJA",
      message: t.insights.alertImproving(`$${Math.round(result.projectedCashflow90d).toLocaleString()}`),
    });
  } else if (result.trend === "stable") {
    alerts.push({ severity: "BAJA", message: t.insights.alertStable });
  }

  if (topDecreasing) {
    const label = t.insights.factors[topDecreasing.feature] ?? topDecreasing.feature;
    alerts.push({ severity: "BAJA", message: t.insights.alertTopFactorDown(label) });
  }

  return alerts;
}

export default function ExplanationsPage() {
  const { t } = useLanguage();
  const { activeCompany } = useCompany();

  const [result, setResult] = useState<MlAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPrediction, setHasPrediction] = useState(false);

  useEffect(() => {
    if (!activeCompany) return;

    let cancelled = false;
    setIsLoading(true);

    getLatestPrediction(activeCompany.id)
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setHasPrediction(true);
      })
      .catch(() => {
        // 404 esperado si todavía no se ha corrido ningún análisis para esta empresa.
        if (cancelled) return;
        setResult(null);
        setHasPrediction(false);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCompany]);

  const alerts = result ? buildAlerts(result, t) : [];

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-slate-900">{t.insights.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {t.insights.subtitle}
      </p>

      {isLoading ? (
        <p className="mt-6 text-sm text-slate-400">{t.insights.loading}</p>
      ) : !hasPrediction ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-600">{t.insights.noPrediction}</p>
          <p className="mt-1 text-sm text-slate-400">{t.insights.noPredictionHint}</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ShapFactorsList factors={result?.shapExplanation ?? []} />

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">{t.insights.activeAlerts}</p>
            {alerts.map((alert, i) => (
              <AlertCard key={i} severity={alert.severity} message={alert.message} />
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
