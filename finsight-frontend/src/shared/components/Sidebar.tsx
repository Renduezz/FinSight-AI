"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Receipt,
  LineChart,
  Lightbulb,
  Settings,
  X,
} from "lucide-react";
import Logo from "./Logo";
import { useLanguage } from "@/shared/context/LanguageContext";
import type { Translations } from "@/shared/i18n/translations";

const NAV_ITEMS = [
  { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "companies", href: "/companies", icon: Building2 },
  { labelKey: "transactions", href: "/transactions", icon: Receipt },
  { labelKey: "predictions", href: "/predictions", icon: LineChart },
  { labelKey: "insights", href: "/explanations", icon: Lightbulb },
  { labelKey: "settings", href: "/settings", icon: Settings },
] satisfies { labelKey: keyof Translations["nav"]; href: string; icon: typeof Settings }[];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { t } = useLanguage();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {t.nav[item.labelKey]}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <>
      {/* Sidebar de escritorio: siempre visible desde md hacia arriba */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <Link href="/dashboard" className="mb-8 inline-block px-2">
          <Logo />
        </Link>
        <NavLinks pathname={pathname} />
      </aside>

      {/* Menu movil: panel deslizable, solo visible por debajo de md cuando isMobileOpen es true */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-64 flex-col bg-white px-4 py-6 shadow-xl">
            <div className="mb-8 flex items-center justify-between px-2">
              <Link href="/dashboard" onClick={onMobileClose}>
                <Logo />
              </Link>
              <button
                onClick={onMobileClose}
                aria-label={t.nav.closeMenu}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  );
}