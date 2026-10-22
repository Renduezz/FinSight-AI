"use client";

import { useLanguage } from "@/shared/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-400">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>{t.common.allRightsReserved}</span>
        <div className="flex gap-4">
          <a href="/terms" className="hover:text-primary hover:underline">{t.footer.terms}</a>
          <a href="/privacy" className="hover:text-primary hover:underline">{t.footer.privacy}</a>
          <a href="/data-policy" className="hover:text-primary hover:underline">{t.footer.dataPolicy}</a>
        </div>
      </div>
    </footer>
  );
}