"use client";

import DashboardLayout from "@/shared/components/DashboardLayout";
import ShapFactorsList from "@/features/insights/components/ShapFactorsList";
import AlertCard from "@/features/insights/components/AlertCard";
import { useLanguage } from "@/shared/context/LanguageContext";

// Placeholder: en el futuro vendrá de GET /companies/{id}/alerts
const MOCK_ALERTS = ["ALTA", "MEDIA", "BAJA"] as const;

export default function ExplanationsPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-slate-900">{t.insights.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {t.insights.subtitle}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ShapFactorsList />

        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">{t.insights.activeAlerts}</p>
          {MOCK_ALERTS.map((severity) => (
            <AlertCard key={severity} severity={severity} message={t.insights.alerts[severity]} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}