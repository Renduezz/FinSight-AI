"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/shared/context/LanguageContext";
import { getPredictionHistory, MlAnalysisResult } from "@/features/predictions/services/predictionApi";

interface PredictionsHistoryTableProps {
  companyId: number | null;
  // Cambia cada vez que se genera una predicción nueva, para volver a pedir el historial.
  refreshKey?: number | null;
}

export default function PredictionsHistoryTable({ companyId, refreshKey }: PredictionsHistoryTableProps) {
  const { t, language } = useLanguage();
  const [history, setHistory] = useState<MlAnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setHistory([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getPredictionHistory(companyId)
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, refreshKey]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">{t.predictions.previous}</p>

      {isLoading ? (
        <p className="mt-4 text-sm text-slate-400">{t.insights.loading}</p>
      ) : history.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">{t.predictions.noHistory}</p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
              <th className="pb-2 font-medium">{t.common.date}</th>
              <th className="pb-2 font-medium">{t.predictions.model}</th>
              <th className="pb-2 font-medium">{t.predictions.riskScore}</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record) => (
              <tr key={record.id} className="border-b border-slate-50 last:border-0">
                <td className="py-3 text-slate-700">
                  {new Date(record.predictionDate).toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="py-3 text-slate-500">{record.modelVersion ?? "—"}</td>
                <td className="py-3 text-slate-500">{Math.round(record.riskScore * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
