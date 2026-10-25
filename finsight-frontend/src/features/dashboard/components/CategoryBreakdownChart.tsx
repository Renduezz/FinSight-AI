"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/shared/context/LanguageContext";
import { formatMoney } from "@/features/dashboard/dashboardData";

interface Slice {
  key: string; // "income" | "expenses"
  name: string;
  value: number;
}

interface Props {
  data: Slice[];
  selectedType: "INGRESO" | "GASTO" | null;
  onSelect: (type: "INGRESO" | "GASTO") => void;
}

const COLORS: Record<string, string> = { income: "#2563EB", expenses: "#EF4444" };
const TYPE_OF: Record<string, "INGRESO" | "GASTO"> = { income: "INGRESO", expenses: "GASTO" };

export default function CategoryBreakdownChart({ data, selectedType, onSelect }: Props) {
  const { t, language } = useLanguage();
  const es = language === "es";
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total <= 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-400">{t.dashboard.noDataYetDot}</p>
      </div>
    );
  }

  const isDimmed = (key: string) => selectedType !== null && TYPE_OF[key] !== selectedType;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-700">{t.dashboard.incomeVsExpenses}</p>
      <p className="mt-1 text-xs text-slate-400">
        {es ? "Haz clic en un color para ver solo ese tipo." : "Click a color to see only that type."}
      </p>

      <div className="mt-2 h-56 w-full [&_.recharts-sector]:cursor-pointer">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              isAnimationActive={false}
              onClick={(_: unknown, index: number) => {
                const slice = data[index];
                if (slice) onSelect(TYPE_OF[slice.key]);
              }}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={COLORS[entry.key] ?? "#94a3b8"}
                  fillOpacity={isDimmed(entry.key) ? 0.3 : 1}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatMoney(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {data.map((entry) => {
          const percent = (entry.value / total) * 100;
          const active = selectedType === TYPE_OF[entry.key];
          return (
            <button
              key={entry.key}
              onClick={() => onSelect(TYPE_OF[entry.key])}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${
                active ? "border-primary bg-primary/5" : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[entry.key] }} />
              <span className="font-medium text-slate-700">{entry.name}</span>
              <span className="text-slate-500">
                {formatMoney(entry.value)} · {percent.toFixed(0)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
