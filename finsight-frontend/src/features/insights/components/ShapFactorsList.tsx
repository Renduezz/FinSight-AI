"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { useLanguage } from "@/shared/context/LanguageContext";
import type { ShapFactor } from "@/features/predictions/services/predictionApi";

interface ShapFactorsListProps {
  factors: ShapFactor[];
}

// Los nombres de las columnas vienen tal cual del modelo (snake_case, en
// inglés). Si alguna vez aparece una columna que no está traducida, mostramos
// el nombre crudo en vez de romper la pantalla.
export default function ShapFactorsList({ factors }: ShapFactorsListProps) {
  const { t } = useLanguage();

  if (factors.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-700">{t.insights.shapTitle}</p>
        <p className="mt-1 text-xs text-slate-400">{t.insights.shapSubtitle}</p>
        <p className="mt-5 text-sm text-slate-400">{t.insights.noPrediction}</p>
      </div>
    );
  }

  // Para dibujar las barras proporcionalmente, usamos el impacto más grande
  // (en valor absoluto) como referencia del 100% de ancho.
  const maxImpact = Math.max(...factors.map((f) => Math.abs(f.impact)), 0.0001);
  // Los valores SHAP del modelo están en escala log-odds (p. ej. -4.95), no en
  // porcentajes. Para mostrarlos con sentido, cada factor se expresa como su
  // parte del peso total de los factores mostrados.
  const totalImpact = factors.reduce((sum, f) => sum + Math.abs(f.impact), 0) || 1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">
        {t.insights.shapTitle}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {t.insights.shapSubtitle}
      </p>

      <div className="mt-5 space-y-4">
        {factors.map((factor) => {
          const isNegativeForRisk = factor.impact < 0;
          const widthPercent = (Math.abs(factor.impact) / maxImpact) * 100;
          const label = t.insights.factors[factor.feature] ?? factor.feature;

          return (
            <div key={factor.feature}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-slate-700">
                  {isNegativeForRisk ? (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  )}
                  {label}
                </span>
                <span className={isNegativeForRisk ? "text-green-600" : "text-red-600"}>
                  {isNegativeForRisk ? "-" : "+"}{((Math.abs(factor.impact) / totalImpact) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${isNegativeForRisk ? "bg-green-500" : "bg-red-500"}`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
