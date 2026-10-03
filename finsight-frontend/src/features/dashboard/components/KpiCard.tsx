interface KpiCardProps {
  label: string;
  value: string;
  changePercent: number; // positivo = subió, negativo = bajó
}

export default function KpiCard({ label, value, changePercent }: KpiCardProps) {
  const isPositive = changePercent >= 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>

      <div className="mt-2 flex items-center gap-1 text-sm">
        <span className={isPositive ? "text-green-600" : "text-red-600"}>
          {isPositive ? "▲" : "▼"} {Math.abs(changePercent)}%
        </span>
        <span className="text-slate-400">vs. previous period</span>
      </div>
    </div>
  );
}