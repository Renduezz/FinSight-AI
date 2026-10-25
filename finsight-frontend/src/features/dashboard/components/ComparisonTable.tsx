"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useLanguage } from "@/shared/context/LanguageContext";
import type { TransactionRecord, PeriodFilter } from "@/shared/context/TransactionsContext";
import { bucketOf, bucketFullLabel, formatMoney } from "@/features/dashboard/dashboardData";

export type GroupBy = "bucket" | "category" | "file";
type MetricKey = "income" | "expenses" | "net" | "margin" | "share" | "count";

interface Props {
  data: TransactionRecord[]; // ya filtrado por el resto del panel
  period: PeriodFilter;
  monthNames: string[];
  fileNames: Record<string, string>; // batchId -> nombre del archivo
  groupBy: GroupBy;
  onGroupByChange: (g: GroupBy) => void;
  selectedBucket: string | null;
  selectedCategory: string | null;
  onRowClick: (groupBy: GroupBy, key: string) => void;
}

interface Row {
  key: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
  count: number;
  margin: number | null;
  share: number | null;
}

export default function ComparisonTable({
  data,
  period,
  monthNames,
  fileNames,
  groupBy,
  onGroupByChange,
  selectedBucket,
  selectedCategory,
  onRowClick,
}: Props) {
  const { language } = useLanguage();
  const es = language === "es";

  const [metrics, setMetrics] = useState<MetricKey[]>(["income", "expenses", "net"]);
  const [sort, setSort] = useState<{ key: "label" | MetricKey; dir: "asc" | "desc" }>({ key: "label", dir: "asc" });

  // Orden inicial razonable según cómo se agrupe.
  useEffect(() => {
    setSort(groupBy === "bucket" ? { key: "label", dir: "asc" } : { key: "expenses", dir: "desc" });
  }, [groupBy]);

  const METRIC_LABELS: Record<MetricKey, string> = {
    income: es ? "Dinero que entró" : "Money in",
    expenses: es ? "Dinero que salió" : "Money out",
    net: es ? "Ganancia / pérdida" : "Profit / loss",
    margin: es ? "Margen (%)" : "Margin (%)",
    share: es ? "% de los gastos" : "% of expenses",
    count: es ? "Movimientos" : "Transactions",
  };

  const GROUP_LABELS: Record<GroupBy, string> = {
    bucket: period === "monthly" ? (es ? "Por día" : "By day") : es ? "Por mes" : "By month",
    category: es ? "Por categoría" : "By category",
    file: es ? "Por archivo" : "By file",
  };

  const { rows, total } = useMemo(() => {
    const map = new Map<string, { label: string; income: number; expenses: number; count: number }>();
    for (const t of data) {
      const key = groupBy === "bucket" ? bucketOf(period, t.fecha) : groupBy === "category" ? t.categoria : t.batchId;
      const label =
        groupBy === "bucket"
          ? bucketFullLabel(period, key, monthNames)
          : groupBy === "category"
          ? key
          : fileNames[key] ?? key;
      const entry = map.get(key) ?? { label, income: 0, expenses: 0, count: 0 };
      if (t.tipo === "INGRESO") entry.income += t.monto;
      else entry.expenses += t.monto;
      entry.count += 1;
      map.set(key, entry);
    }
    const totalExpenses = Array.from(map.values()).reduce((s, e) => s + e.expenses, 0);
    const totalIncome = Array.from(map.values()).reduce((s, e) => s + e.income, 0);
    const built: Row[] = Array.from(map.entries()).map(([key, e]) => ({
      key,
      label: e.label,
      income: e.income,
      expenses: e.expenses,
      net: e.income - e.expenses,
      count: e.count,
      margin: e.income > 0 ? ((e.income - e.expenses) / e.income) * 100 : null,
      share: totalExpenses > 0 ? (e.expenses / totalExpenses) * 100 : null,
    }));
    const totalRow: Row = {
      key: "__total",
      label: "Total",
      income: totalIncome,
      expenses: totalExpenses,
      net: totalIncome - totalExpenses,
      count: built.reduce((s, r) => s + r.count, 0),
      margin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : null,
      share: totalExpenses > 0 ? 100 : null,
    };
    return { rows: built, total: totalRow };
  }, [data, groupBy, period, monthNames, fileNames]);

  const sorted = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      let cmp: number;
      if (sort.key === "label") {
        // Para meses/días la clave ISO ordena cronológicamente.
        cmp = groupBy === "bucket" ? a.key.localeCompare(b.key) : a.label.localeCompare(b.label);
      } else {
        cmp = (a[sort.key] ?? -Infinity) - (b[sort.key] ?? -Infinity);
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [rows, sort, groupBy]);

  function toggleMetric(key: MetricKey) {
    setMetrics((prev) => {
      if (prev.includes(key)) return prev.length > 1 ? prev.filter((m) => m !== key) : prev;
      const order: MetricKey[] = ["income", "expenses", "net", "margin", "share", "count"];
      return order.filter((m) => m === key || prev.includes(m));
    });
  }

  function toggleSort(key: "label" | MetricKey) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  }

  function format(row: Row, key: MetricKey): string {
    const v = row[key];
    if (v === null) return "—";
    if (key === "margin" || key === "share") return `${v.toFixed(1)}%`;
    if (key === "count") return String(v);
    return formatMoney(v);
  }

  function isSelected(row: Row): boolean {
    if (groupBy === "bucket") return row.key === selectedBucket;
    if (groupBy === "category") return row.key === selectedCategory;
    return false;
  }

  const clickable = groupBy !== "file";
  const firstHeader = groupBy === "bucket" ? (period === "monthly" ? (es ? "Día" : "Day") : es ? "Mes" : "Month") : groupBy === "category" ? (es ? "Categoría" : "Category") : es ? "Archivo" : "File";

  const SortIcon = ({ k }: { k: "label" | MetricKey }) =>
    sort.key === k ? sort.dir === "asc" ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" /> : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-700">{es ? "Tabla comparativa" : "Comparison table"}</p>
      <p className="mt-1 text-xs text-slate-400">
        {es
          ? "Elige cómo agrupar y qué columnas ver. Haz clic en un título para ordenar y en una fila para filtrar el resto del panel."
          : "Choose how to group and which columns to see. Click a heading to sort and a row to filter the rest of the dashboard."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">{es ? "Agrupar:" : "Group:"}</span>
        {(Object.keys(GROUP_LABELS) as GroupBy[]).map((g) => (
          <button
            key={g}
            onClick={() => onGroupByChange(g)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              groupBy === g ? "border-primary bg-primary text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {GROUP_LABELS[g]}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">{es ? "Columnas:" : "Columns:"}</span>
        {(Object.keys(METRIC_LABELS) as MetricKey[]).map((m) => (
          <label key={m} className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={metrics.includes(m)}
              onChange={() => toggleMetric(m)}
              className="h-3.5 w-3.5 accent-primary"
            />
            {METRIC_LABELS[m]}
          </label>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">{es ? "No hay datos con los filtros actuales." : "No data for the current filters."}</p>
      ) : (
        <div className="mt-4 max-h-96 overflow-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                <th className="cursor-pointer pb-2 pr-3 font-medium" onClick={() => toggleSort("label")}>
                  {firstHeader} <SortIcon k="label" />
                </th>
                {metrics.map((m) => (
                  <th key={m} className="cursor-pointer pb-2 pl-3 text-right font-medium" onClick={() => toggleSort(m)}>
                    {METRIC_LABELS[m]} <SortIcon k={m} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr
                  key={row.key}
                  onClick={clickable ? () => onRowClick(groupBy, row.key) : undefined}
                  className={`border-b border-slate-50 ${clickable ? "cursor-pointer" : ""} ${
                    isSelected(row) ? "bg-primary/5" : clickable ? "hover:bg-slate-50" : ""
                  }`}
                >
                  <td className="py-2 pr-3 text-slate-700">{row.label}</td>
                  {metrics.map((m) => (
                    <td
                      key={m}
                      className={`py-2 pl-3 text-right ${
                        m === "net" || m === "margin"
                          ? (row[m] ?? 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                          : "text-slate-600"
                      }`}
                    >
                      {format(row, m)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 font-semibold">
                <td className="pt-2 pr-3 text-slate-800">Total</td>
                {metrics.map((m) => (
                  <td
                    key={m}
                    className={`pt-2 pl-3 text-right ${
                      m === "net" || m === "margin" ? ((total[m] ?? 0) >= 0 ? "text-green-600" : "text-red-600") : "text-slate-800"
                    }`}
                  >
                    {format(total, m)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
