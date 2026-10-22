"use client";

import { useLanguage } from "@/shared/context/LanguageContext";

interface CashflowForecastCardProps {
  projectedAmount: string;
  period: string;
}

export default function CashflowForecastCard({ projectedAmount, period }: CashflowForecastCardProps) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-700">{t.predictions.projectedCashFlow}</p>
      <p className="mt-2 text-sm text-slate-400">{period}</p>
      <p className="mt-4 text-3xl font-bold text-slate-900">{projectedAmount}</p>
      <p className="mt-2 text-xs text-slate-400">
        {t.predictions.estimateNote}
      </p>
    </div>
  );
}