"use client";

import { useEffect, useState } from "react";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "@/shared/context/LanguageContext";
import { formatMoney } from "@/features/dashboard/dashboardData";

export interface TrendPoint {
  key: string; // identificador único (mes o día)
  label: string; // texto corto del eje
  fullLabel: string; // texto completo para el detalle
  income: number;
  expenses: number;
}

interface Props {
  data: TrendPoint[];
  showIncome: boolean;
  showExpenses: boolean;
  selectedBucket: string | null;
  onSelectBucket: (key: string | null) => void;
}

const MIN_VISIBLE = 3;

function labelOf(state: unknown, points: TrendPoint[]): string | null {
  const s = state as { activeLabel?: string | number; activeIndex?: string | number | null } | undefined;
  if (s?.activeLabel !== undefined && s.activeLabel !== null) return String(s.activeLabel);
  const idx = Number(s?.activeIndex);
  if (Number.isInteger(idx) && points[idx]) return points[idx].key;
  return null;
}

export default function CashflowTrendChart({ data, showIncome, showExpenses, selectedBucket, onSelectBucket }: Props) {
  const { t, language } = useLanguage();
  const es = language === "es";
  const last = Math.max(data.length - 1, 0);

  const [range, setRange] = useState<[number, number]>([0, last]);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);

  // Si cambian los datos (otro periodo u otros archivos), se vuelve a ver todo.
  useEffect(() => {
    setRange([0, Math.max(data.length - 1, 0)]);
  }, [data.length]);

  const start = Math.min(range[0], last);
  const end = Math.min(range[1], last);
  const visible = data.slice(start, end + 1);
  const visibleCount = end - start + 1;
  const canZoom = data.length > MIN_VISIBLE;
  const labels = new Map(data.map((p) => [p.key, p.label]));
  const fullLabels = new Map(data.map((p) => [p.key, p.fullLabel]));

  function zoomIn() {
    if (visibleCount <= MIN_VISIBLE) return;
    const step = Math.max(Math.floor(visibleCount / 4), 1);
    const newStart = start + step;
    const newEnd = end - step;
    if (newEnd - newStart + 1 < MIN_VISIBLE) {
      const mid = Math.round((start + end) / 2);
      const s = Math.max(0, Math.min(mid - 1, last - (MIN_VISIBLE - 1)));
      setRange([s, s + MIN_VISIBLE - 1]);
    } else {
      setRange([newStart, newEnd]);
    }
  }

  function zoomOut() {
    const step = Math.max(Math.ceil(visibleCount / 2), 1);
    setRange([Math.max(0, start - step), Math.min(last, end + step)]);
  }

  function pan(direction: -1 | 1) {
    const step = Math.max(Math.floor(visibleCount / 3), 1);
    const s = Math.min(Math.max(start + direction * step, 0), last - (visibleCount - 1));
    setRange([s, s + visibleCount - 1]);
  }

  function resetDrag() {
    setDragStart(null);
    setDragEnd(null);
  }

  function handleMouseUp() {
    if (dragStart === null) return;
    const a = visible.findIndex((p) => p.key === dragStart);
    const b = visible.findIndex((p) => p.key === (dragEnd ?? dragStart));
    if (a >= 0 && b >= 0 && a !== b) {
      // Arrastrar = acercar a ese tramo
      setRange([start + Math.min(a, b), start + Math.max(a, b)]);
    } else if (a >= 0) {
      // Un solo clic = filtrar el resto del panel por ese mes
      const key = visible[a].key;
      onSelectBucket(selectedBucket === key ? null : key);
    }
    resetDrag();
  }

  const compact = new Intl.NumberFormat(es ? "es" : "en", { notation: "compact", maximumFractionDigits: 1 });

  const btn =
    "flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40";

  const dragArea =
    dragStart !== null && dragEnd !== null && dragStart !== dragEnd ? { from: dragStart, to: dragEnd } : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-700">{t.dashboard.monthlyCashFlow}</p>
          <p className="mt-1 text-xs text-slate-400">
            {es
              ? "Haz clic en un punto para filtrar ese mes · arrastra sobre la gráfica para acercar."
              : "Click a point to filter that month · drag across the chart to zoom in."}
          </p>
        </div>
        {canZoom && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => pan(-1)} disabled={start === 0} className={btn} title={es ? "Mover a la izquierda" : "Move left"} aria-label={es ? "Mover a la izquierda" : "Move left"}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => pan(1)} disabled={end === last} className={btn} title={es ? "Mover a la derecha" : "Move right"} aria-label={es ? "Mover a la derecha" : "Move right"}>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={zoomIn} disabled={visibleCount <= MIN_VISIBLE} className={btn} title={es ? "Acercar" : "Zoom in"} aria-label={es ? "Acercar" : "Zoom in"}>
              <ZoomIn className="h-4 w-4" />
            </button>
            <button onClick={zoomOut} disabled={visibleCount >= data.length} className={btn} title={es ? "Alejar" : "Zoom out"} aria-label={es ? "Alejar" : "Zoom out"}>
              <ZoomOut className="h-4 w-4" />
            </button>
            <button onClick={() => setRange([0, last])} disabled={visibleCount >= data.length} className={btn} title={es ? "Ver todo" : "Reset"} aria-label={es ? "Ver todo" : "Reset"}>
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 h-72 w-full select-none [&_.recharts-wrapper]:cursor-crosshair">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={visible}
            onMouseDown={(state: unknown) => {
              const l = labelOf(state, visible);
              if (l !== null) {
                setDragStart(l);
                setDragEnd(l);
              }
            }}
            onMouseMove={(state: unknown) => {
              const l = labelOf(state, visible);
              if (dragStart !== null && l !== null) setDragEnd(l);
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={resetDrag}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="key" stroke="#94a3b8" fontSize={12} tickFormatter={(k) => labels.get(String(k)) ?? String(k)} />
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => compact.format(Number(v))} width={56} />
            <Tooltip
              formatter={(value) => formatMoney(Number(value))}
              labelFormatter={(k) => fullLabels.get(String(k)) ?? String(k)}
            />
            <Legend />
            {selectedBucket && visible.some((p) => p.key === selectedBucket) && (
              <ReferenceArea x1={selectedBucket} x2={selectedBucket} fill="#2563EB" fillOpacity={0.12} />
            )}
            {dragArea && <ReferenceArea x1={dragArea.from} x2={dragArea.to} fill="#94a3b8" fillOpacity={0.25} />}
            {showIncome && (
              <Line type="monotone" dataKey="income" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name={t.common.income} isAnimationActive={false} />
            )}
            {showExpenses && (
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name={t.common.expenses} isAnimationActive={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {canZoom && (
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
          <span>{data[start]?.label}</span>
          <input
            type="range"
            min={0}
            max={Math.max(last - (visibleCount - 1), 0)}
            value={start}
            onChange={(e) => {
              const s = Number(e.target.value);
              setRange([s, s + visibleCount - 1]);
            }}
            className="h-1 flex-1 accent-primary"
            aria-label={es ? "Desplazar la gráfica" : "Scroll the chart"}
          />
          <span>{data[end]?.label}</span>
        </div>
      )}
    </div>
  );
}
