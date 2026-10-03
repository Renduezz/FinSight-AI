import DashboardLayout from "@/shared/components/DashboardLayout";
import ShapFactorsList from "@/features/insights/components/ShapFactorsList";
import AlertCard from "@/features/insights/components/AlertCard";

// Placeholder: en el futuro vendrá de GET /companies/{id}/alerts
const MOCK_ALERTS = [
  { severity: "ALTA" as const, message: "Expenses in the Payroll category grew 23% compared to the previous quarter, well above your revenue growth." },
  { severity: "MEDIA" as const, message: "Three consecutive months show declining sales. Consider reviewing your sales strategy." },
  { severity: "BAJA" as const, message: "Your cash reserve covers approximately 1.8 months of fixed expenses." },
];

export default function ExplanationsPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-slate-900">Insights</h1>
      <p className="mt-1 text-sm text-slate-500">
        Understand what drives your risk score and what to do about it.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ShapFactorsList />

        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Active Alerts</p>
          {MOCK_ALERTS.map((alert, i) => (
            <AlertCard key={i} severity={alert.severity} message={alert.message} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}