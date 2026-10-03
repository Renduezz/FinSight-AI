"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export interface TransactionRecord {
  id: string;
  fecha: string;
  tipo: "INGRESO" | "GASTO";
  categoria: string;
  monto: number;
  descripcion: string;
}

export interface UploadRecord {
  fileName: string;
  date: string;
  size: string;
  status: "Completed" | "Processing" | "Error";
  errorMessage?: string;
}

interface Kpis {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  cashFlow: number;
}

interface TrendPoint {
  month: string;
  income: number;
  expenses: number;
}

interface CategorySlice {
  name: string;
  value: number;
}

export type RiskLevel = "Low" | "Medium" | "High";

interface RiskHeuristic {
  score: number; // 0 a 1
  level: RiskLevel;
  projectedCashflow: number;
}

interface TransactionsContextValue {
  transactions: TransactionRecord[];
  uploads: UploadRecord[];
  kpis: Kpis;
  monthlyTrend: TrendPoint[];
  categoryBreakdown: CategorySlice[];
  riskHeuristic: RiskHeuristic;
  addUpload: (records: Omit<TransactionRecord, "id">[], upload: UploadRecord) => void;
  removeTransaction: (id: string) => void;
  clearAll: () => void;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);

  function addUpload(records: Omit<TransactionRecord, "id">[], upload: UploadRecord) {
    const withIds: TransactionRecord[] = records.map((r) => ({
      ...r,
      id: crypto.randomUUID(),
    }));
    setTransactions((prev) => [...prev, ...withIds]);
    setUploads((prev) => [upload, ...prev]);
  }

  function removeTransaction(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  function clearAll() {
    setTransactions([]);
    setUploads([]);
  }

  const kpis = useMemo<Kpis>(() => {
    const totalIncome = transactions.filter((t) => t.tipo === "INGRESO").reduce((sum, t) => sum + t.monto, 0);
    const totalExpenses = transactions.filter((t) => t.tipo === "GASTO").reduce((sum, t) => sum + t.monto, 0);
    const netProfit = totalIncome - totalExpenses;
    const cashFlow = netProfit;
    return { totalIncome, totalExpenses, netProfit, cashFlow };
  }, [transactions]);

  const monthlyTrend = useMemo<TrendPoint[]>(() => {
    const map = new Map<string, { income: number; expenses: number }>();
    for (const t of transactions) {
      const parsedDate = new Date(t.fecha);
      const label = MONTH_NAMES[parsedDate.getMonth()] ?? "N/A";
      const entry = map.get(label) ?? { income: 0, expenses: 0 };
      if (t.tipo === "INGRESO") entry.income += t.monto;
      else entry.expenses += t.monto;
      map.set(label, entry);
    }
    return MONTH_NAMES.filter((m) => map.has(m)).map((m) => ({ month: m, ...map.get(m)! }));
  }, [transactions]);

  // Desglose por categoría de GASTOS (no Ingreso vs Gasto genérico):
  // responde a lo que pide el documento ("gastos por categoría").
  const categoryBreakdown = useMemo<CategorySlice[]>(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.tipo !== "GASTO") continue;
      map.set(t.categoria, (map.get(t.categoria) ?? 0) + t.monto);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Heurístico simple de riesgo (NO es Machine Learning): una regla de negocio
  // básica mientras el microservicio de Python no está listo. Se basa en qué
  // porcentaje de los ingresos se van en gastos — entre más alto, más riesgo.
  const riskHeuristic = useMemo<RiskHeuristic>(() => {
    if (kpis.totalIncome === 0) {
      return { score: 0, level: "Low", projectedCashflow: 0 };
    }
    const burnRatio = kpis.totalExpenses / kpis.totalIncome;
    const score = Math.min(Math.max(burnRatio - 0.3, 0) / 0.7, 1); // normalizado entre 0 y 1
    const level: RiskLevel = score < 0.33 ? "Low" : score < 0.66 ? "Medium" : "High";

    // Proyección simple: promedio de utilidad neta mensual de los meses con datos.
    const monthsWithData = monthlyTrend.length || 1;
    const avgMonthlyNet = kpis.netProfit / monthsWithData;
    const projectedCashflow = kpis.cashFlow + avgMonthlyNet;

    return { score, level, projectedCashflow };
  }, [kpis, monthlyTrend]);

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        uploads,
        kpis,
        monthlyTrend,
        categoryBreakdown,
        riskHeuristic,
        addUpload,
        removeTransaction,
        clearAll,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionsProvider");
  return ctx;
}