"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/shared/context/LanguageContext";

interface Slice {
  key: string;
  name: string;
  value: number;
}

const COLORS: Record<string, string> = { income: "#2563EB", expenses: "#EF4444" };

export default function CategoryBreakdownChart({ data }: { data: Slice[] }) {
  const { t } = useLanguage();
  const hasData = data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-400">{t.dashboard.noDataYetDot}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-700">{t.dashboard.incomeVsExpenses}</p>
      <div className="mt-2 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
              {data.map((entry) => (
                <Cell key={entry.key} fill={COLORS[entry.key] ?? "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}