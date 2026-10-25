"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UploadCloud, X } from "lucide-react";
import DashboardLayout from "@/shared/components/DashboardLayout";
import KpiCard, { KpiChange } from "@/features/dashboard/components/KpiCard";
import CashflowTrendChart, { TrendPoint } from "@/features/dashboard/components/CashflowTrendChart";
import CategoryBreakdownChart from "@/features/dashboard/components/CategoryBreakdownChart";
import CategoryBreakdownList from "@/features/dashboard/components/CategoryBreakdownList";
import ComparisonTable, { GroupBy } from "@/features/dashboard/components/ComparisonTable";
import {
  DashFilter,
  EMPTY_FILTER,
  isFilterActive,
  applyFilter,
  totals,
  bucketOf,
  bucketLabel,
  bucketFullLabel,
  isComparable,
  pctChange,
  formatMoney,
  sumByCategory,
} from "@/features/dashboard/dashboardData";
import { useTransactions, PeriodFilter } from "@/shared/context/TransactionsContext";
import { useCompany } from "@/shared/context/CompanyContext";
import { useLanguage } from "@/shared/context/LanguageContext";

export default function DashboardPage() {
  const {
    transactions,
    previousTransactions,
    selectedTransactions,
    uploads,
    period,
    setPeriod,
    availablePeriodKeys,
    selectedPeriodKey,
    setSelectedPeriodKey,
    formatPeriodKey,
  } = useTransactions();
  const { activeCompany } = useCompany();
  const { t, language } = useLanguage();
  const es = language === "es";
  const monthNames = t.common.monthNames;
  const hasData = transactions.length > 0;

  const [filter, setFilter] = useState<DashFilter>(EMPTY_FILTER);
  const [groupBy, setGroupBy] = useState<GroupBy>("bucket");

  // Los filtros se limpian al cambiar de empresa, de periodo o de archivos.
  const resetKey = `${activeCompany?.id ?? ""}|${period}|${selectedPeriodKey ?? ""}|${selectedTransactions.length}`;
  useEffect(() => {
    setFilter(EMPTY_FILTER);
  }, [resetKey]);

  const fileNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const u of uploads) map[u.batchId] = u.fileName;
    return map;
  }, [uploads]);

  // ---------------------------------------------------------------- toggles
  function toggleType(type: "INGRESO" | "GASTO") {
    setFilter((f) => ({ ...f, type: f.type === type ? null : type, category: null }));
  }
  function toggleCategory(name: string, type: "INGRESO" | "GASTO") {
    setFilter((f) => (f.category === name ? { ...f, category: null } : { ...f, category: name, type }));
  }
  function toggleBucket(key: string | null) {
    setFilter((f) => ({ ...f, bucket: key }));
  }
  function handleTableRow(g: GroupBy, key: string) {
    if (g === "bucket") setFilter((f) => ({ ...f, bucket: f.bucket === key ? null : key }));
    if (g === "category") {
      const row = transactions.find((tx) => tx.categoria === key);
      setFilter((f) =>
        f.category === key ? { ...f, category: null } : { ...f, category: key, type: row?.tipo ?? f.type },
      );
    }
  }

  // ---------------------------------------------------------------- datos
  // Tarjetas: responden solo al mes seleccionado (no al tipo ni la categoría).
  const kpiBase = useMemo(
    () => applyFilter(transactions, { ...EMPTY_FILTER, bucket: filter.bucket }, period),
    [transactions, filter.bucket, period],
  );
  const cur = useMemo(() => totals(kpiBase), [kpiBase]);

  const prevBase = previousTransactions;
  const prev = useMemo(() => totals(prevBase), [prevBase]);
  const comparable = !filter.bucket && isComparable(period, transactions, prevBase);

  const ratio = cur.income > 0 ? cur.expenses / cur.income : null;

  // Saldo acumulado: todo el historial de los archivos seleccionados hasta el
  // último movimiento del periodo mostrado.
  const balance = useMemo(() => {
    if (transactions.length === 0) return 0;
    const lastDate = transactions.reduce((m, tx) => (tx.fecha.slice(0, 10) > m ? tx.fecha.slice(0, 10) : m), "");
    return selectedTransactions
      .filter((tx) => tx.fecha.slice(0, 10) <= lastDate)
      .reduce((sum, tx) => sum + (tx.tipo === "INGRESO" ? tx.monto : -tx.monto), 0);
  }, [transactions, selectedTransactions]);

  function change(curr: number, previous: number, goodWhenUp: boolean): KpiChange | null {
    if (!comparable) return null;
    const pct = pctChange(curr, previous);
    if (pct === null) return null;
    return {
      percent: pct,
      goodWhenUp,
      label: pct >= 0 ? (es ? "más que el periodo anterior" : "more than the previous period") : es ? "menos que el periodo anterior" : "less than the previous period",
    };
  }

  const noChangeText = filter.bucket
    ? es ? "Quita el filtro de mes para comparar." : "Remove the month filter to compare."
    : es ? "Sin un periodo anterior comparable." : "No comparable previous period.";

  // Gráfica de tendencia: responde a tipo y categoría (no a su propio mes).
  const trendPoints = useMemo<TrendPoint[]>(() => {
    const rows = applyFilter(transactions, filter, period, { bucket: true });
    const map = new Map<string, { income: number; expenses: number }>();
    for (const tx of rows) {
      const key = bucketOf(period, tx.fecha);
      const entry = map.get(key) ?? { income: 0, expenses: 0 };
      if (tx.tipo === "INGRESO") entry.income += tx.monto;
      else entry.expenses += tx.monto;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        key,
        label: bucketLabel(period, key, monthNames),
        fullLabel: bucketFullLabel(period, key, monthNames),
        income: v.income,
        expenses: v.expenses,
      }));
  }, [transactions, filter, period, monthNames]);

  // Círculo ingresos vs gastos: responde solo al mes.
  const donutData = useMemo(() => {
    const t0 = totals(applyFilter(transactions, { ...EMPTY_FILTER, bucket: filter.bucket }, period));
    return [
      { key: "income", name: t.common.income, value: t0.income },
      { key: "expenses", name: t.common.expenses, value: t0.expenses },
    ];
  }, [transactions, filter.bucket, period, t]);

  // Barras por categoría: del tipo elegido (por defecto, gastos), respondiendo al mes.
  const listType: "INGRESO" | "GASTO" = filter.type ?? "GASTO";
  const categoryData = useMemo(
    () => sumByCategory(applyFilter(transactions, { ...EMPTY_FILTER, bucket: filter.bucket }, period), listType),
    [transactions, filter.bucket, period, listType],
  );

  // Resumen en palabras simples de la categoría elegida.
  const categoryInsight = useMemo(() => {
    if (!filter.category) return null;
    const rows = applyFilter(transactions, { ...EMPTY_FILTER, category: filter.category, bucket: filter.bucket }, period);
    const base = totals(applyFilter(transactions, { ...EMPTY_FILTER, bucket: filter.bucket }, period));
    const isIncome = rows[0]?.tipo === "INGRESO";
    const amount = rows.reduce((s, tx) => s + tx.monto, 0);
    const denom = isIncome ? base.income : base.expenses;
    return { amount, count: rows.length, isIncome, percent: denom > 0 ? (amount / denom) * 100 : 0 };
  }, [transactions, filter.category, filter.bucket, period]);

  // Tabla comparativa: responde a todo salvo a su propia agrupación.
  const tableData = useMemo(
    () =>
      applyFilter(transactions, filter, period, {
        bucket: groupBy === "bucket",
        category: groupBy === "category",
      }),
    [transactions, filter, period, groupBy],
  );

  // ---------------------------------------------------------------- tarjetas
  const profit = cur.net;
  const profitBadge =
    ratio === null
      ? undefined
      : ratio < 0.85
      ? { text: es ? "Vas bien" : "Healthy", tone: "good" as const }
      : ratio <= 1
      ? { text: es ? "Margen ajustado" : "Tight margin", tone: "warn" as const }
      : { text: es ? "Estás en pérdida" : "Losing money", tone: "bad" as const };

  const spendPer100 = ratio === null ? null : Math.round(ratio * 100);

  const profitSubtitle =
    spendPer100 === null
      ? es ? "Todavía no hay ingresos para comparar." : "There is no income to compare yet."
      : profit >= 0
      ? es
        ? `Te quedó ganancia: gastas $${spendPer100} de cada $100 que entran.`
        : `You made a profit: you spend $${spendPer100} of every $100 that comes in.`
      : es
      ? `Estás perdiendo: gastas $${spendPer100} de cada $100 que entran.`
      : `You are losing money: you spend $${spendPer100} of every $100 that comes in.`;

  const kpiCards = [
    {
      label: es ? "Dinero que entró" : "Money in",
      value: formatMoney(cur.income),
      subtitle: es ? "Todo lo que cobraste por ventas y otros ingresos." : "Everything you earned from sales and other income.",
      help: es
        ? "Es la suma de todos los ingresos del periodo. Haz clic en la tarjeta para ver solo los ingresos en la gráfica, la tabla y las barras."
        : "The sum of all income in the period. Click the card to see only income in the chart, table and bars.",
      change: change(cur.income, prev.income, true),
      valueTone: "neutral" as const,
      active: filter.type === "INGRESO",
      onClick: () => toggleType("INGRESO"),
    },
    {
      label: es ? "Dinero que salió" : "Money out",
      value: formatMoney(cur.expenses),
      subtitle: es ? "Todo lo que pagaste: nómina, arriendo, proveedores, impuestos, etc." : "Everything you paid: payroll, rent, suppliers, taxes, etc.",
      help: es
        ? "Es la suma de todos los gastos del periodo. Si sube mucho más rápido que lo que entra, la empresa se queda sin margen. Haz clic para ver solo los gastos."
        : "The sum of all expenses in the period. If it grows faster than income, the company loses margin. Click to see only expenses.",
      change: change(cur.expenses, prev.expenses, false),
      valueTone: "neutral" as const,
      active: filter.type === "GASTO",
      onClick: () => toggleType("GASTO"),
    },
    {
      label: es ? "Ganancia o pérdida" : "Profit or loss",
      value: formatMoney(profit),
      subtitle: profitSubtitle,
      help: es
        ? "Es lo que te queda después de pagar todo: dinero que entró menos dinero que salió. En verde ganas, en rojo pierdes."
        : "What is left after paying everything: money in minus money out. Green means profit, red means loss.",
      change: change(cur.net, prev.net, true),
      valueTone: profit >= 0 ? ("good" as const) : ("bad" as const),
      badge: profitBadge,
    },
    {
      label: es ? "Dinero acumulado" : "Running balance",
      value: formatMoney(balance),
      subtitle: es
        ? "Lo que llevas sumando todo el historial (entradas menos salidas), sin contar un saldo inicial."
        : "What you have by adding the whole history (in minus out), not counting an opening balance.",
      help: es
        ? "A diferencia de la ganancia del periodo, este número acumula todos los meses de los archivos seleccionados hasta hoy. Si es negativo, has gastado más de lo que has recibido en total."
        : "Unlike the period's profit, this adds up every month of the selected files up to today. If negative, you have spent more than you have received in total.",
      change: null,
      valueTone: balance >= 0 ? ("good" as const) : ("bad" as const),
    },
  ];

  // ---------------------------------------------------------------- filtros activos (chips)
  const chips: { text: string; clear: () => void }[] = [];
  if (filter.type)
    chips.push({
      text: filter.type === "INGRESO" ? (es ? "Solo dinero que entró" : "Money in only") : es ? "Solo dinero que salió" : "Money out only",
      clear: () => setFilter((f) => ({ ...f, type: null, category: null })),
    });
  if (filter.category)
    chips.push({ text: `${es ? "Categoría" : "Category"}: ${filter.category}`, clear: () => setFilter((f) => ({ ...f, category: null })) });
  if (filter.bucket)
    chips.push({
      text: `${es ? "Periodo" : "Period"}: ${bucketFullLabel(period, filter.bucket, monthNames)}`,
      clear: () => setFilter((f) => ({ ...f, bucket: null })),
    });

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.dashboard.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-primary"
          >
            <option value="monthly">{t.dashboard.monthly}</option>
            <option value="quarterly">{t.dashboard.quarterly}</option>
            <option value="yearly">{t.dashboard.yearly}</option>
          </select>

          {availablePeriodKeys.length > 0 && (
            <select
              value={selectedPeriodKey ?? ""}
              onChange={(e) => setSelectedPeriodKey(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-primary"
            >
              {availablePeriodKeys.map((key) => (
                <option key={key} value={key}>{formatPeriodKey(key)}</option>
              ))}
            </select>
          )}

          <Link href="/transactions" className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark">
            <UploadCloud className="h-4 w-4" /> {t.dashboard.uploadData}
          </Link>
        </div>
      </div>

      {!hasData ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-600">{t.dashboard.noDataTitle}</p>
          <p className="mt-1 text-sm text-slate-400">{t.dashboard.noDataHint}</p>
        </div>
      ) : (
        <>
          <p className="mt-3 text-xs text-slate-400">
            {es
              ? "Este panel es interactivo: haz clic en las tarjetas, en la gráfica, en el círculo, en las barras o en la tabla para enfocarte en una parte de tus datos."
              : "This dashboard is interactive: click the cards, chart, circle, bars or table to focus on part of your data."}
          </p>

          {isFilterActive(filter) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">{es ? "Estás viendo:" : "You are viewing:"}</span>
              {chips.map((chip) => (
                <button
                  key={chip.text}
                  onClick={chip.clear}
                  className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                >
                  {chip.text} <X className="h-3 w-3" />
                </button>
              ))}
              <button onClick={() => setFilter(EMPTY_FILTER)} className="text-xs font-medium text-slate-500 underline hover:text-slate-700">
                {es ? "Quitar todos los filtros" : "Clear all filters"}
              </button>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} noChangeText={noChangeText} />
            ))}
          </div>

          {categoryInsight && filter.category && (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-slate-700">
              {es ? (
                <>
                  <strong>{filter.category}</strong>: {formatMoney(categoryInsight.amount)} en {categoryInsight.count} movimientos, es el{" "}
                  <strong>{categoryInsight.percent.toFixed(0)}%</strong> de {categoryInsight.isIncome ? "tus ingresos" : "tus gastos"}
                  {filter.bucket ? " de ese periodo" : ""}.
                </>
              ) : (
                <>
                  <strong>{filter.category}</strong>: {formatMoney(categoryInsight.amount)} across {categoryInsight.count} transactions, which is{" "}
                  <strong>{categoryInsight.percent.toFixed(0)}%</strong> of your {categoryInsight.isIncome ? "income" : "expenses"}
                  {filter.bucket ? " in that period" : ""}.
                </>
              )}
            </div>
          )}

          <div className="mt-6">
            <CashflowTrendChart
              data={trendPoints}
              showIncome={filter.type !== "GASTO"}
              showExpenses={filter.type !== "INGRESO"}
              selectedBucket={filter.bucket}
              onSelectBucket={toggleBucket}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CategoryBreakdownChart data={donutData} selectedType={filter.type} onSelect={toggleType} />
            <CategoryBreakdownList
              data={categoryData}
              type={listType}
              selected={filter.category}
              onSelect={(name) => toggleCategory(name, listType)}
            />
          </div>

          <div className="mt-6">
            <ComparisonTable
              data={tableData}
              period={period}
              monthNames={monthNames}
              fileNames={fileNames}
              groupBy={groupBy}
              onGroupByChange={setGroupBy}
              selectedBucket={filter.bucket}
              selectedCategory={filter.category}
              onRowClick={handleTableRow}
            />
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
