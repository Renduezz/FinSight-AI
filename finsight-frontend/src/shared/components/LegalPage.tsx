"use client";

import Logo from "./Logo";
import Footer from "./Footer";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "@/shared/context/LanguageContext";
import type { Translations } from "@/shared/i18n/translations";

interface LegalPageProps {
  section: keyof Translations["legal"];
}

export default function LegalPage({ section }: LegalPageProps) {
  const { t } = useLanguage();
  const content = t.legal[section];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <a href="/login"><Logo /></a>
        <LanguageToggle />
      </header>
      <main className="mx-auto max-w-2xl flex-1 px-6 py-10 text-sm text-slate-600">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">{content.title}</h1>
        <p className="mb-6 text-xs text-slate-400">{t.common.lastUpdated}</p>

        {content.paragraphs.map((paragraph, i) => (
          <p key={i} className="mb-4 last:mb-0">{paragraph}</p>
        ))}
      </main>
      <Footer />
    </div>
  );
}
