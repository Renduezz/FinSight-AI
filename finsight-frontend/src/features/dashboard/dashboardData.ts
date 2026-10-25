import type { TransactionRecord, PeriodFilter } from "@/shared/context/TransactionsContext";

// Filtros interactivos del panel (se activan haciendo clic).
export interface DashFilter {
  type: "INGRESO" | "GASTO" | null; // dinero que entra / dinero que sale
  category: string | null; // una categoría concreta (ej. Nómina)
  bucket: string | null; // un mes (o un día, si el periodo es mensual)
}

export const EMPTY_FILTER: DashFilter = { type: null, category: null, bucket: null };

export function isFilterActive(f: DashFilter): boolean {
  return f.type !== null || f.category !== null || f.bucket !== null;
}

// Clave de agrupación del eje de tiempo: día si el periodo es "mensual";
// mes (AAAA-MM) en cualquier otro caso.
export function bucketOf(period: PeriodFilter, fecha: string): string {
  const day = fecha.slice(0, 10);
  return period === "monthly" ? day : day.slice(0, 7);
}

export function bucketLabel(period: PeriodFilter, key: string, monthNames: string[]): string {
  if (period === "monthly") return String(Number(key.slice(8, 10)));
  return monthNames[Number(key.slice(5, 7)) - 1] ?? key;
}

export function bucketFullLabel(period: PeriodFilter, key: string, monthNames: string[]): string {
  if (period === "monthly") {
    return `${Number(key.slice(8, 10))} ${monthNames[Number(key.slice(5, 7)) - 1] ?? ""} ${key.slice(0, 4)}`;
  }
  return `${monthNames[Number(key.slice(5, 7)) - 1] ?? key} ${key.slice(0, 4)}`;
}

interface Skip {
  type?: boolean;
  category?: boolean;
  bucket?: boolean;
}

// Aplica los filtros activos. "skip" permite ignorar uno (el de la propia
// gráfica que se está dibujando), como hace Power BI.
export function applyFilter(
  txs: TransactionRecord[],
  f: DashFilter,
  period: PeriodFilter,
  skip: Skip = {},
): TransactionRecord[] {
  return txs.filter(
    (t) =>
      (skip.type || !f.type || t.tipo === f.type) &&
      (skip.category || !f.category || t.categoria === f.category) &&
      (skip.bucket || !f.bucket || bucketOf(period, t.fecha) === f.bucket),
  );
}

export interface Totals {
  income: number;
  expenses: number;
  net: number;
  count: number;
}

export function totals(txs: TransactionRecord[]): Totals {
  let income = 0;
  let expenses = 0;
  for (const t of txs) {
    if (t.tipo === "INGRESO") income += t.monto;
    else expenses += t.monto;
  }
  return { income, expenses, net: income - expenses, count: txs.length };
}

function monthsWithData(txs: TransactionRecord[]): number {
  return new Set(txs.map((t) => t.fecha.slice(0, 7))).size;
}

// Solo se compara contra el periodo anterior cuando ambos cubren la misma
// cantidad de meses; si no (p. ej. 10 meses contra 2), el porcentaje engaña.
export function isComparable(
  period: PeriodFilter,
  current: TransactionRecord[],
  previous: TransactionRecord[],
): boolean {
  if (previous.length === 0 || current.length === 0) return false;
  if (period === "monthly") return true;
  return monthsWithData(current) === monthsWithData(previous);
}

export function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

export function formatMoney(n: number): string {
  const rounded = Math.round(n);
  return `${rounded < 0 ? "-" : ""}$${Math.abs(rounded).toLocaleString()}`;
}

export function sumByCategory(txs: TransactionRecord[], type: "INGRESO" | "GASTO") {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.tipo !== type) continue;
    map.set(t.categoria, (map.get(t.categoria) ?? 0) + t.monto);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
