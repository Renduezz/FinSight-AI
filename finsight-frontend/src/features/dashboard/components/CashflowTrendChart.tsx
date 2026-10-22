"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/shared/context/LanguageContext";

interface TrendPoint {
  month: string;
  income: number;
  expenses: number;
}

export default function CashflowTrendChart({ data }: { data: TrendPoint[] }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-700">{t.dashboard.monthlyCashFlow}</p>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="income" stroke="#2563EB" strokeWidth={2} name={t.common.income} />
            <Line type="monotone" dataKey="expenses" stroke="#94a3b8" strokeWidth={2} name={t.common.expenses} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}