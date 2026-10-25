"use client";

import { useEffect, useState } from "react";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/shared/context/LanguageContext";

interface TrendPoint {
  month: string;
  income: number;
  expenses: number;
}

const MIN_VISIBLE = 3; // mínimo de puntos visibles al acercar

export default function CashflowTrendChart({ data }: { data: TrendPoint[] }) {
  const { t, language } = useLanguage();
  const es = language === "es";
  const last = Math.max(data.length - 1, 0);

  // Rango visible [start, end] (índices inclusivos). Por defecto, todo.
  const [range, setRange] = useState<[number, number]>([0, last]);

  // Si cambian los datos (otro periodo, otros archivos), se vuelve a ver todo.
  useEffect(() => {
    setRange([0, Math.max(data.length - 1, 0)]);
  }, [data.length]);

  const [start, end] = [Math.min(range[0], last), Math.min(range[1], last)];
  const visible = data.slice(start, end + 1);
  const visibleCount = end - start + 1;
  const canZoom = data.length > MIN_VISIBLE;

  function zoomIn() {
    if (visibleCount <= MIN_VISIBLE) return;
    const step = Math.max(Math.floor(visibleCount / 4), 1);
    const newStart = start + step;
    const newEnd = end - step;
    if (newEnd - newStart + 1 < MIN_VISIBLE) {
      const mid = Math.round((start + end) / 2);
      const s = Math.max(0, mid - 1);
      setRange([s, Math.min(last, s + MIN_VISIBLE - 1)]);
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
    const shift = direction * step;
    const s = Math.min(Math.max(start + shift, 0), last - (visibleCount - 1));
    setRange([s, s + visibleCount - 1]);
  }

  const compact = new Intl.NumberFormat(es ? "es" : "en", { notation: "compact", maximumFractionDigits: 1 });
  const money = (v: unknown) => `$${Math.round(Number(v)).toLocaleString()}`;

  const btn =
    "flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">{t.dashboard.monthlyCashFlow}</p>
        {canZoom && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => pan(-1)} disabled={start === 0} className={btn} aria-label={es ? "Mover a la izquierda" : "Move left"} title={es ? "Mover a la izquierda" : "Move left"}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => pan(1)} disabled={end === last} className={btn} aria-label={es ? "Mover a la derecha" : "Move right"} title={es ? "Mover a la derecha" : "Move right"}>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={zoomIn} disabled={visibleCount <= MIN_VISIBLE} className={btn} aria-label={es ? "Acercar" : "Zoom in"} title={es ? "Acercar" : "Zoom in"}>
              <ZoomIn className="h-4 w-4" />
            </button>
            <button onClick={zoomOut} disabled={visibleCount >= data.length} className={btn} aria-label={es ? "Alejar" : "Zoom out"} title={es ? "Alejar" : "Zoom out"}>
              <ZoomOut className="h-4 w-4" />
            </button>
            <button onClick={() => setRange([0, last])} disabled={visibleCount >= data.length} className={btn} aria-label={es ? "Ver todo" : "Reset"} title={es ? "Ver todo" : "Reset"}>
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visible}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => compact.format(Number(v))} width={56} />
            <Tooltip formatter={(value) => money(value)} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name={t.common.income} />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name={t.common.expenses} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {canZoom && (
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
          <span>{data[start]?.month}</span>
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
          <span>{data[end]?.month}</span>
        </div>
      )}
    </div>
  );
}
