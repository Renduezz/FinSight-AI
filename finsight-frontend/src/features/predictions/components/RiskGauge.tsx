interface RiskGaugeProps {
  riskScore: number; // 0 a 1
}

export default function RiskGauge({ riskScore }: RiskGaugeProps) {
  const percentage = Math.round(riskScore * 100);

  const level =
    percentage < 33 ? "Low" : percentage < 66 ? "Medium" : "High";

  const color =
    level === "Low" ? "#16A34A" : level === "Medium" ? "#D97706" : "#DC2626";

  // Un semicírculo dibujado con SVG: el radio es fijo, y el "arco recorrido"
  // (strokeDasharray) representa qué tan lleno está, según el porcentaje.
  const radius = 80;
  const circumference = Math.PI * radius; // longitud de medio círculo
  const filled = (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="self-start text-sm font-medium text-slate-700">Risk Score</p>

      <svg viewBox="0 0 200 110" className="mt-2 w-56">
        {/* Fondo del arco (gris, siempre completo) */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={14}
          strokeLinecap="round"
        />
        {/* Arco relleno (color según el nivel de riesgo) */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>

      <p className="-mt-6 text-3xl font-bold text-slate-900">{percentage}%</p>
      <span
        className="mt-1 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        {level} Risk
      </span>
    </div>
  );
}