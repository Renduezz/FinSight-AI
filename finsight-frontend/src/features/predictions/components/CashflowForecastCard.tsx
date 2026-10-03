interface CashflowForecastCardProps {
  projectedAmount: string;
  period: string;
}

export default function CashflowForecastCard({ projectedAmount, period }: CashflowForecastCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-700">Projected Cash Flow</p>
      <p className="mt-2 text-sm text-slate-400">{period}</p>
      <p className="mt-4 text-3xl font-bold text-slate-900">{projectedAmount}</p>
      <p className="mt-2 text-xs text-slate-400">
        Estimate based on historical transaction patterns.
      </p>
    </div>
  );
}