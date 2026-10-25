"use client";

import { useLanguage } from "@/shared/context/LanguageContext";
import { formatMoney } from "@/features/dashboard/dashboardData";

interface CategorySlice {
  name: string;
  value: number;
}

interface Props {
  data: CategorySlice[];
  type: "INGRESO" | "GASTO"; // qué lista se está mostrando
  selected: string | null;
  onSelect: (name: string) => void;
}

const PALETTE = ["#2563EB", "#EF4444", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899", "#06B6D4"];

export default function CategoryBreakdownList({ data, type, selected, onSelect }: Props) {
  const { t, language } = useLanguage();
  const es = language === "es";
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const title =
    type === "GASTO" ? t.dashboard.expensesByCategory : es ? "Ingresos por categoría" : "Income by category";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-400">
        {es ? "Haz clic en una barra para ver solo esa categoría." : "Click a bar to see only that category."}
      </p>

      {data.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">{t.dashboard.noExpenseData}</p>
      ) : (
        <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
          {data.map((item, index) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0;
            const isSelected = selected === item.name;
            const dimmed = selected !== null && !isSelected;
            return (
              <button
                key={item.name}
                onClick={() => onSelect(item.name)}
                className={`block w-full rounded-lg px-2 py-1.5 text-left transition ${
                  isSelected ? "bg-primary/5 ring-1 ring-primary/40" : "hover:bg-slate-50"
                } ${dimmed ? "opacity-40" : ""}`}
              >
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-700">{item.name}</span>
                  <span className="font-medium text-slate-500">
                    {formatMoney(item.value)} · {percent.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${percent}%`, backgroundColor: PALETTE[index % PALETTE.length] }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
