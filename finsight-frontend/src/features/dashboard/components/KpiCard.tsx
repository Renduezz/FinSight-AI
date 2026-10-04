interface KpiCardProps {
  label: string;
  value: string;
  changePercent: number;
  invert?: boolean; // true para métricas donde "subir" es malo (ej. Gastos)
}

export default function KpiCard({ label, value, changePercent, invert = false }: KpiCardProps) {
  const wentUp = changePercent >= 0;
  // Normalmente "subir" = bueno (verde). Pero para Gastos, subir es malo,
  // así que invertimos qué color corresponde a cada dirección.
  const isGood = invert ? !wentUp : wentUp;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>

      <div className="mt-2 flex items-center gap-1 text-sm">
        <span className={isGood ? "text-green-600" : "text-red-600"}>
          {wentUp ? "▲" : "▼"} {Math.abs(changePercent).toFixed(1)}%
        </span>
        <span className="text-slate-400">vs. previous period</span>
      </div>
    </div>
  );
}