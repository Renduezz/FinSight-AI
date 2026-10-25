"use client";

import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from "react";
import { useCompany } from "./CompanyContext";
import { useLanguage } from "./LanguageContext";

export interface TransactionRecord {
  id: string;
  batchId: string;
  fecha: string;
  tipo: "INGRESO" | "GASTO";
  categoria: string;
  monto: number;
  descripcion: string;
}

export interface UploadRecord {
  batchId: string;
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
  score: number;
  level: RiskLevel;
  projectedCashflow: number;
}

export type PeriodFilter = "monthly" | "quarterly" | "yearly";

interface TransactionsContextValue {
  transactions: TransactionRecord[];
  uploads: UploadRecord[];
  kpis: Kpis;
  kpiChanges: Kpis;
  trendData: TrendPoint[];
  categoryBreakdown: CategorySlice[];
  riskHeuristic: RiskHeuristic;
  period: PeriodFilter;
  setPeriod: (p: PeriodFilter) => void;
  availablePeriodKeys: string[];
  selectedPeriodKey: string | null;
  setSelectedPeriodKey: (key: string) => void;
  formatPeriodKey: (key: string) => string;
  // Archivos seleccionados. Lista vacía = todos los archivos.
  selectedBatchIds: string[];
  toggleBatch: (id: string) => void;
  selectAllBatches: () => void;
  // Todas las transacciones de los archivos seleccionados (sin filtrar por periodo).
  selectedTransactions: TransactionRecord[];
  addUpload: (companyId: number, records: Omit<TransactionRecord, "id" | "batchId">[], upload: Omit<UploadRecord, "batchId">) => void;
  removeTransaction: (id: string) => void;
  clearAll: () => void;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

const STORAGE_KEY = "finsight_transactions_v1";
// Archivos seleccionados por empresa. Se guardan aparte para que todas las
// pestañas abiertas vean la misma selección en tiempo real.
const SELECTION_KEY = "finsight_selected_batches_v1";

function readSelection(companyKey: string): string[] {
  try {
    const raw = localStorage.getItem(SELECTION_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    return Array.isArray(parsed[companyKey]) ? parsed[companyKey] : [];
  } catch {
    return [];
  }
}

function writeSelection(companyKey: string, ids: string[]) {
  try {
    const raw = localStorage.getItem(SELECTION_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    parsed[companyKey] = ids;
    localStorage.setItem(SELECTION_KEY, JSON.stringify(parsed));
  } catch {
    // sin almacenamiento: la selección sigue funcionando solo en esta pestaña
  }
}

function periodKeyOf(period: PeriodFilter, d: Date): string {
  if (period === "yearly") return String(d.getFullYear());
  if (period === "quarterly") return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parsePeriodKey(period: PeriodFilter, key: string): Date {
  if (period === "yearly") return new Date(Number(key), 0, 1);
  if (period === "quarterly") {
    const [y, q] = key.split("-Q");
    return new Date(Number(y), (Number(q) - 1) * 3, 1);
  }
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1);
}

function formatPeriodKeyLabel(period: PeriodFilter, key: string, monthNames: string[]): string {
  if (period === "yearly") return key;
  if (period === "quarterly") {
    const [y, q] = key.split("-Q");
    return `Q${q} ${y}`;
  }
  const [y, m] = key.split("-");
  return `${monthNames[Number(m) - 1]} ${y}`;
}

function getPeriodRange(refDate: Date, period: PeriodFilter, offset: number): [Date, Date] {
  if (period === "yearly") {
    const y = refDate.getFullYear() + offset;
    return [new Date(y, 0, 1), new Date(y + 1, 0, 1)];
  }
  if (period === "quarterly") {
    const qStartMonth = Math.floor(refDate.getMonth() / 3) * 3;
    const start = new Date(refDate.getFullYear(), qStartMonth + offset * 3, 1);
    const end = new Date(refDate.getFullYear(), qStartMonth + offset * 3 + 3, 1);
    return [start, end];
  }
  const start = new Date(refDate.getFullYear(), refDate.getMonth() + offset, 1);
  const end = new Date(refDate.getFullYear(), refDate.getMonth() + offset + 1, 1);
  return [start, end];
}

function inRange(dateStr: string, range: [Date, Date]) {
  const d = new Date(dateStr);
  return d >= range[0] && d < range[1];
}

function calcKpis(records: TransactionRecord[]): Kpis {
  const totalIncome = records.filter((t) => t.tipo === "INGRESO").reduce((sum, t) => sum + t.monto, 0);
  const totalExpenses = records.filter((t) => t.tipo === "GASTO").reduce((sum, t) => sum + t.monto, 0);
  const netProfit = totalIncome - totalExpenses;
  return { totalIncome, totalExpenses, netProfit, cashFlow: netProfit };
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

interface PersistedShape {
  byCompany: Record<string, TransactionRecord[]>;
  uploadsByCompany: Record<string, UploadRecord[]>;
}

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const monthNames = t.common.monthNames;
  const { activeCompany } = useCompany();
  const [byCompany, setByCompany] = useState<Record<string, TransactionRecord[]>>({});
  const [uploadsByCompany, setUploadsByCompany] = useState<Record<string, UploadRecord[]>>({});
  const [period, setPeriod] = useState<PeriodFilter>("yearly");
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string | null>(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Cargar desde localStorage una sola vez, al montar la app.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PersistedShape = JSON.parse(raw);
        setByCompany(parsed.byCompany ?? {});
        setUploadsByCompany(parsed.uploadsByCompany ?? {});
      }
    } catch {
      // Si el dato guardado está corrupto, simplemente empezamos vacío.
    } finally {
      setHasLoadedFromStorage(true);
    }
  }, []);

  // Guardar en localStorage cada vez que los datos cambien (después de la carga inicial).
  useEffect(() => {
    if (!hasLoadedFromStorage) return;
    const payload: PersistedShape = { byCompany, uploadsByCompany };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Si el navegador se queda sin espacio de almacenamiento, lo ignoramos silenciosamente.
    }
  }, [byCompany, uploadsByCompany, hasLoadedFromStorage]);

  const companyId = activeCompany?.id ?? -1;
  const companyKey = String(companyId);
  const allTransactions = byCompany[companyKey] ?? [];
  const uploads = uploadsByCompany[companyKey] ?? [];

  // Al cambiar de empresa se carga la selección guardada de esa empresa
  // (vacía = todos los archivos).
  useEffect(() => {
    setSelectedBatchIds(readSelection(companyKey));
  }, [companyKey]);

  // Sincronización entre pestañas: si en otra ventana se marcan/desmarcan
  // archivos o se suben datos, esta ventana se actualiza sola.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === SELECTION_KEY) {
        setSelectedBatchIds(readSelection(companyKey));
      } else if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed: PersistedShape = JSON.parse(e.newValue);
          setByCompany(parsed.byCompany ?? {});
          setUploadsByCompany(parsed.uploadsByCompany ?? {});
        } catch {
          // dato corrupto: lo ignoramos
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [companyKey]);

  function toggleBatch(id: string) {
    const next = selectedBatchIds.includes(id)
      ? selectedBatchIds.filter((x) => x !== id)
      : [...selectedBatchIds, id];
    setSelectedBatchIds(next);
    writeSelection(companyKey, next);
  }

  function selectAllBatches() {
    setSelectedBatchIds([]);
    writeSelection(companyKey, []);
  }

  function addUpload(
    targetCompanyId: number,
    records: Omit<TransactionRecord, "id" | "batchId">[],
    upload: Omit<UploadRecord, "batchId">
  ) {
    const batchId = crypto.randomUUID();
    const key = String(targetCompanyId);
    const withIds: TransactionRecord[] = records.map((r) => ({ ...r, id: crypto.randomUUID(), batchId }));

    setByCompany((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), ...withIds] }));
    setUploadsByCompany((prev) => ({ ...prev, [key]: [{ ...upload, batchId }, ...(prev[key] ?? [])] }));
  }

  function removeTransaction(id: string) {
    setByCompany((prev) => ({ ...prev, [companyKey]: (prev[companyKey] ?? []).filter((t) => t.id !== id) }));
  }

  function clearAll() {
    setByCompany((prev) => ({ ...prev, [companyKey]: [] }));
    setUploadsByCompany((prev) => ({ ...prev, [companyKey]: [] }));
    selectAllBatches();
  }

  // Filtro por "lote" (archivo subido): "all" = ver el historial completo.
  const batchFiltered = useMemo(() => {
    if (selectedBatchIds.length === 0) return allTransactions;
    return allTransactions.filter((t) => selectedBatchIds.includes(t.batchId));
  }, [allTransactions, selectedBatchIds]);

  // Claves de periodo disponibles (ej. ["2026-06","2026-05",...]) según los
  // datos realmente presentes, para que el usuario elija cuál ver.
  const availablePeriodKeys = useMemo(() => {
    const set = new Set<string>();
    for (const t of batchFiltered) set.add(periodKeyOf(period, new Date(t.fecha)));
    return Array.from(set).sort().reverse();
  }, [batchFiltered, period]);

  // Si el periodo seleccionado ya no existe en los datos (cambiaste de tipo
  // de periodo, de empresa, o de lote), volvemos automáticamente al más reciente.
  useEffect(() => {
    if (availablePeriodKeys.length === 0) {
      setSelectedPeriodKey(null);
      return;
    }
    if (!selectedPeriodKey || !availablePeriodKeys.includes(selectedPeriodKey)) {
      setSelectedPeriodKey(availablePeriodKeys[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePeriodKeys.join(",")]);

  const referenceDate = selectedPeriodKey ? parsePeriodKey(period, selectedPeriodKey) : null;

  const transactions = useMemo(() => {
    if (!referenceDate) return [];
    const range = getPeriodRange(referenceDate, period, 0);
    return batchFiltered.filter((t) => inRange(t.fecha, range));
  }, [batchFiltered, referenceDate, period]);

  const previousTransactions = useMemo(() => {
    if (!referenceDate) return [];
    const range = getPeriodRange(referenceDate, period, -1);
    return batchFiltered.filter((t) => inRange(t.fecha, range));
  }, [batchFiltered, referenceDate, period]);

  const kpis = useMemo(() => calcKpis(transactions), [transactions]);
  const previousKpis = useMemo(() => calcKpis(previousTransactions), [previousTransactions]);

  const kpiChanges = useMemo<Kpis>(() => ({
    totalIncome: pctChange(kpis.totalIncome, previousKpis.totalIncome),
    totalExpenses: pctChange(kpis.totalExpenses, previousKpis.totalExpenses),
    netProfit: pctChange(kpis.netProfit, previousKpis.netProfit),
    cashFlow: pctChange(kpis.cashFlow, previousKpis.cashFlow),
  }), [kpis, previousKpis]);

  // Si el periodo es "monthly", agrupamos por DÍA (tiene sentido ver el detalle
  // diario de un solo mes). Si es "quarterly" o "yearly", agrupamos por MES.
  const trendData = useMemo<TrendPoint[]>(() => {
    const map = new Map<string, { label: string; income: number; expenses: number; sortKey: string }>();
    for (const t of transactions) {
      const d = new Date(t.fecha);
      const sortKey = period === "monthly" ? t.fecha : `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      const label = period === "monthly" ? String(d.getDate()) : monthNames[d.getMonth()];
      const entry = map.get(sortKey) ?? { label, income: 0, expenses: 0, sortKey };
      if (t.tipo === "INGRESO") entry.income += t.monto;
      else entry.expenses += t.monto;
      map.set(sortKey, entry);
    }
    return Array.from(map.values())
      .sort((a, b) => (a.sortKey < b.sortKey ? -1 : 1))
      .map(({ label, income, expenses }) => ({ month: label, income, expenses }));
  }, [transactions, period, monthNames]);

  const categoryBreakdown = useMemo<CategorySlice[]>(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.tipo !== "GASTO") continue;
      map.set(t.categoria, (map.get(t.categoria) ?? 0) + t.monto);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const riskHeuristic = useMemo<RiskHeuristic>(() => {
    if (kpis.totalIncome === 0) return { score: 0, level: "Low", projectedCashflow: 0 };
    const burnRatio = kpis.totalExpenses / kpis.totalIncome;
    const score = Math.min(Math.max(burnRatio - 0.3, 0) / 0.7, 1);
    const level: RiskLevel = score < 0.33 ? "Low" : score < 0.66 ? "Medium" : "High";
    const monthsWithData = trendData.length || 1;
    const avgNet = kpis.netProfit / monthsWithData;
    return { score, level, projectedCashflow: kpis.cashFlow + avgNet };
  }, [kpis, trendData]);

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        uploads,
        kpis,
        kpiChanges,
        trendData,
        categoryBreakdown,
        riskHeuristic,
        period,
        setPeriod,
        availablePeriodKeys,
        selectedPeriodKey,
        setSelectedPeriodKey,
        formatPeriodKey: (key) => formatPeriodKeyLabel(period, key, monthNames),
        selectedBatchIds,
        toggleBatch,
        selectAllBatches,
        selectedTransactions: batchFiltered,
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
