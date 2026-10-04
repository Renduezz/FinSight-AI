"use client";

import Link from "next/link";
import DashboardLayout from "@/shared/components/DashboardLayout";
import KpiCard from "@/features/dashboard/components/KpiCard";
import CashflowTrendChart from "@/features/dashboard/components/CashflowTrendChart";
import CategoryBreakdownChart from "@/features/dashboard/components/CategoryBreakdownChart";
import CategoryBreakdownList from "@/features/dashboard/components/CategoryBreakdownList";
import { useTransactions, PeriodFilter } from "@/shared/context/TransactionsContext";
import { UploadCloud } from "lucide-react";

export default function DashboardPage() {
  const {
    transactions, kpis, kpiChanges, trendData, categoryBreakdown,
    period, setPeriod, availablePeriodKeys, selectedPeriodKey, setSelectedPeriodKey, formatPeriodKey,
  } = useTransactions();
  const hasData = transactions.length > 0;

  const kpiCards = [
    { label: "Total Income", value: `$${kpis.totalIncome.toLocaleString()}`, changePercent: kpiChanges.totalIncome },
    { label: "Total Expenses", value: `$${kpis.totalExpenses.toLocaleString()}`, changePercent: kpiChanges.totalExpenses, invert: true },
    { label: "Net Profit", value: `$${kpis.netProfit.toLocaleString()}`, changePercent: kpiChanges.netProfit },
    { label: "Cash Flow", value: `$${kpis.cashFlow.toLocaleString()}`, changePercent: kpiChanges.cashFlow },
  ];

  const incomeVsExpenses = [
    { name: "Income", value: kpis.totalIncome },
    { name: "Expenses", value: kpis.totalExpenses },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Real-time financial overview of your company.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-primary"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
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
            <UploadCloud className="h-4 w-4" /> Upload Data
          </Link>
        </div>
      </div>

      {!hasData ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-600">No data for this period</p>
          <p className="mt-1 text-sm text-slate-400">
            Upload a CSV file, or pick a different period above.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </div>

          <div className="mt-6" key={`trend-${period}-${selectedPeriodKey}`}>
            <CashflowTrendChart data={trendData} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2" key={`breakdown-${period}-${selectedPeriodKey}`}>
            <CategoryBreakdownChart data={incomeVsExpenses} />
            <CategoryBreakdownList data={categoryBreakdown} />
          </div>
        </>
      )}
    </DashboardLayout>
  );
}