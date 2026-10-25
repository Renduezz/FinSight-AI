"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";

export interface KpiChange {
  percent: number;
  goodWhenUp: boolean; // en Gastos, subir es malo
  label: string; // ej. "más que el periodo anterior"
}

interface KpiCardProps {
  label: string;
  value: string;
  subtitle: string; // explicación en palabras simples
  help: string; // texto del botón "?"
  change: KpiChange | null;
  noChangeText: string; // se muestra cuando no hay periodo comparable
  valueTone?: "good" | "bad" | "neutral";
  badge?: { text: string; tone: "good" | "warn" | "bad" };
  active?: boolean;
  onClick?: () => void;
}

const BADGE_STYLES = {
  good: "bg-green-50 text-green-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-700",
};

export default function KpiCard({
  label,
  value,
  subtitle,
  help,
  change,
  noChangeText,
  valueTone = "neutral",
  badge,
  active = false,
  onClick,
}: KpiCardProps) {
  const [showHelp, setShowHelp] = useState(false);
  const clickable = Boolean(onClick);

  const valueColor =
    valueTone === "good" ? "text-green-600" : valueTone === "bad" ? "text-red-600" : "text-slate-900";

  let changeNode: React.ReactNode;
  if (change) {
    const wentUp = change.percent >= 0;
    const isGood = change.goodWhenUp ? wentUp : !wentUp;
    changeNode = (
      <>
        <span className={isGood ? "font-medium text-green-600" : "font-medium text-red-600"}>
          {wentUp ? "▲" : "▼"} {Math.abs(change.percent).toFixed(1)}%
        </span>{" "}
        <span className="text-slate-400">{change.label}</span>
      </>
    );
  } else {
    changeNode = <span className="text-slate-400">{noChangeText}</span>;
  }

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-pressed={clickable ? active : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (clickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`rounded-xl border bg-white p-5 shadow-sm transition ${
        active ? "border-primary ring-2 ring-primary/30" : "border-slate-200"
      } ${clickable ? "cursor-pointer hover:border-primary/50 hover:shadow-md" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowHelp((prev) => !prev);
          }}
          aria-label="?"
          className="text-slate-400 hover:text-primary"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>

      <p className={`mt-2 text-2xl font-bold ${valueColor}`}>{value}</p>

      {badge && (
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[badge.tone]}`}>
          {badge.text}
        </span>
      )}

      <p className="mt-2 text-xs leading-relaxed text-slate-500">{subtitle}</p>
      <p className="mt-2 text-xs">{changeNode}</p>

      {showHelp && (
        <p className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-600">{help}</p>
      )}
    </div>
  );
}
