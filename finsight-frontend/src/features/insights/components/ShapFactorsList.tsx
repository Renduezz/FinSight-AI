"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { useLanguage } from "@/shared/context/LanguageContext";
import type { Translations } from "@/shared/i18n/translations";

interface ShapFactor {
  variable: keyof Translations["insights"]["factors"];
  impact: number; // positivo = aumenta el riesgo, negativo = lo reduce
}

// Placeholder: en el futuro vendrá de GET /companies/{id}/predictions/{id}/shap
const MOCK_FACTORS: ShapFactor[] = [
  { variable: "irregularCashflow", impact: 0.18 },
  { variable: "payrollConcentration", impact: 0.12 },
  { variable: "decliningSales", impact: 0.08 },
  { variable: "consistentIncome", impact: -0.14 },
  { variable: "lowClientReliance", impact: -0.07 },
];

export default function ShapFactorsList() {
  const { t } = useLanguage();
  // Para dibujar las barras proporcionalmente, usamos el impacto más grande
  // (en valor absoluto) como referencia del 100% de ancho.
  const maxImpact = Math.max(...MOCK_FACTORS.map((f) => Math.abs(f.impact)));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">
        {t.insights.shapTitle}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {t.insights.shapSubtitle}
      </p>

      <div className="mt-5 space-y-4">
        {MOCK_FACTORS.map((factor) => {
          const isNegativeForRisk = factor.impact < 0;
          const widthPercent = (Math.abs(factor.impact) / maxImpact) * 100;

          return (
            <div key={factor.variable}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-slate-700">
                  {isNegativeForRisk ? (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  )}
                  {t.insights.factors[factor.variable]}
                </span>
                <span className={isNegativeForRisk ? "text-green-600" : "text-red-600"}>
                  {isNegativeForRisk ? "" : "+"}{(factor.impact * 100).toFixed(0)}%
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