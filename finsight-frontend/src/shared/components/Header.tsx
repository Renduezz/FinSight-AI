"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import { useCompany } from "@/shared/context/CompanyContext";
import { useAuth } from "@/shared/context/AuthContext";
import { useLanguage } from "@/shared/context/LanguageContext";
import { useTransactions } from "@/shared/context/TransactionsContext";
import { getLatestPrediction, MlAnalysisResult } from "@/features/predictions/services/predictionApi";
import LanguageToggle from "./LanguageToggle";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Notice = { id: string; level: "high" | "medium" | "low"; text: string };

const NOTICE_STYLES: Record<Notice["level"], string> = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-blue-200 bg-blue-50 text-blue-700",
};

// Avisos reales a partir del último análisis de IA de la empresa activa.
function buildNotices(p: MlAnalysisResult, es: boolean): Notice[] {
  const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const pct = Math.round(p.riskScore * 100);
  const notices: Notice[] = [];
  const level = pct >= 66 ? "high" : pct >= 33 ? "medium" : "low";
  notices.push({
    id: "risk",
    level,
    text: es ? `Último análisis: riesgo ${pct}% (${p.riskLevel}).` : `Latest analysis: ${pct}% risk (${p.riskLevel}).`,
  });
  if (p.trend === "worsening") {
    notices.push({
      id: "trend",
      level: "high",
      text:
        p.estimatedDaysToDepletion === 0
          ? es ? "Tu balance proyectado ya es negativo y la tendencia sigue bajando." : "Your projected balance is already negative and still declining."
          : es ? `Si sigue esta tendencia, te quedarías sin fondos en unos ${p.estimatedDaysToDepletion} días.` : `If this trend continues you would run out of funds in about ${p.estimatedDaysToDepletion} days.`,
    });
  } else if (p.trend === "improving" && p.projectedCashflow90d != null) {
    notices.push({
      id: "trend",
      level: "low",
      text: es ? `Tendencia positiva: flujo de caja proyectado a 90 días ${money(p.projectedCashflow90d)}.` : `Positive trend: projected cash flow in 90 days ${money(p.projectedCashflow90d)}.`,
    });
  }
  return notices;
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { companies, activeCompany, setActiveCompanyId } = useCompany();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const { language } = useLanguage();
  const es = language === "es";
  const { selectedTransactions } = useTransactions();

  // ---------------- Búsqueda global
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return null;
    const pages = [
      { label: t.nav.dashboard, href: "/dashboard" },
      { label: t.nav.companies, href: "/companies" },
      { label: t.nav.transactions, href: "/transactions" },
      { label: t.nav.predictions, href: "/predictions" },
      { label: t.nav.insights, href: "/explanations" },
      { label: t.nav.settings, href: "/settings" },
    ].filter((p) => p.label.toLowerCase().includes(q));
    const comps = companies.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5);
    const txs = selectedTransactions
      .filter((x) => `${x.categoria} ${x.descripcion}`.toLowerCase().includes(q))
      .slice(0, 6);
    return { pages, comps, txs };
  }, [query, companies, selectedTransactions, t]);

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  // ---------------- Notificaciones
  const [bellOpen, setBellOpen] = useState(false);
  const [prediction, setPrediction] = useState<MlAnalysisResult | null>(null);
  const [seenId, setSeenId] = useState<number | null>(null);
  const companyId = activeCompany?.id ?? null;

  useEffect(() => {
    setPrediction(null);
    if (companyId == null) return;
    let cancelled = false;
    getLatestPrediction(companyId)
      .then((p) => {
        if (cancelled) return;
        setPrediction(p);
        try {
          const raw = localStorage.getItem(`finsight_seen_pred_${companyId}`);
          setSeenId(raw ? Number(raw) : null);
        } catch {
          setSeenId(null);
        }
      })
      .catch(() => {
        if (!cancelled) setPrediction(null);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const notices = prediction ? buildNotices(prediction, es) : [];
  const hasUnread = prediction != null && prediction.id !== seenId;

  function toggleBell() {
    const next = !bellOpen;
    setBellOpen(next);
    if (next && prediction && companyId != null) {
      setSeenId(prediction.id);
      try {
        localStorage.setItem(`finsight_seen_pred_${companyId}`, String(prediction.id));
      } catch {
        // sin almacenamiento: el punto rojo volverá a aparecer, no es grave
      }
    }
  }

  return (
    <header className="flex h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:gap-4 sm:px-6">
      <div className="flex flex-1 items-center gap-2 sm:gap-3">
        <button
          onClick={onMenuClick}
          aria-label={t.nav.openMenu}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-50 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative w-full max-w-[9rem] sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder={t.header.search}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />

          {searchOpen && results && (
            <>
              <div className="fixed inset-0 z-30" onClick={closeSearch} />
              <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-2 shadow-lg sm:w-96">
                {results.pages.length + results.comps.length + results.txs.length === 0 && (
                  <p className="px-2 py-3 text-sm text-slate-400">{es ? "Sin resultados." : "No results."}</p>
                )}

                {results.pages.length > 0 && (
                  <div className="mb-1">
                    <p className="px-2 py-1 text-xs font-semibold uppercase text-slate-400">{es ? "Pantallas" : "Pages"}</p>
                    {results.pages.map((p) => (
                      <button
                        key={p.href}
                        onClick={() => { router.push(p.href); closeSearch(); }}
                        className="block w-full rounded px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}

                {results.comps.length > 0 && (
                  <div className="mb-1">
                    <p className="px-2 py-1 text-xs font-semibold uppercase text-slate-400">{es ? "Empresas" : "Companies"}</p>
                    {results.comps.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setActiveCompanyId(c.id); router.push("/dashboard"); closeSearch(); }}
                        className="block w-full rounded px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}

                {results.txs.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-xs font-semibold uppercase text-slate-400">{es ? "Transacciones" : "Transactions"}</p>
                    {results.txs.map((x) => (
                      <button
                        key={x.id}
                        onClick={() => { router.push("/transactions"); closeSearch(); }}
                        className="flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <span className="truncate">{x.categoria} · {x.fecha}</span>
                        <span className={x.tipo === "INGRESO" ? "text-green-600" : "text-red-500"}>
                          ${Math.round(x.monto).toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <select
          value={activeCompany?.id ?? ""}
          onChange={(e) => setActiveCompanyId(Number(e.target.value))}
          className="max-w-[6rem] rounded-lg border border-slate-300 px-2 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-primary sm:max-w-none sm:px-3"
        >
          {companies.length === 0 && <option value="">{t.header.noCompanies}</option>}
          {companies.map((company) => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <LanguageToggle />

        <div className="relative">
          <button
            onClick={toggleBell}
            aria-label={t.header.notifications}
            className="relative rounded-full p-2 text-slate-500 hover:bg-slate-50"
          >
            <Bell className="h-5 w-5" />
            {hasUnread && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />}
          </button>

          {bellOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-lg sm:w-80">
                <p className="mb-2 text-sm font-semibold text-slate-700">{t.header.notifications}</p>
                {notices.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    {es
                      ? "No hay notificaciones. Ejecuta un análisis IA en Predicciones para recibir avisos."
                      : "No notifications. Run an AI analysis in Predictions to get alerts."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notices.map((n) => (
                      <div key={n.id} className={`rounded-lg border px-3 py-2 text-xs ${NOTICE_STYLES[n.level]}`}>
                        {n.text}
                      </div>
                    ))}
                    <Link
                      href="/explanations"
                      onClick={() => setBellOpen(false)}
                      className="block pt-1 text-xs font-medium text-primary hover:underline"
                    >
                      {es ? "Ver detalle en Análisis" : "See details in Insights"}
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {user ? getInitials(user.name) : "?"}
            </span>
            <span className="hidden text-left text-sm sm:block">
              <span className="block font-medium text-slate-700">{user?.name ?? "..."}</span>
              <span className="block text-xs text-slate-400">{activeCompany?.sector ?? "—"}</span>
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <Link href="/settings" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">{t.header.settings}</Link>
              <button
                onClick={logout}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50"
              >
                {t.header.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
