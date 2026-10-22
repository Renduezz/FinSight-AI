"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/shared/context/LanguageContext";

export default function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      aria-label={t.language.switchTo}
      title={t.language.switchTo}
      className="flex items-center gap-1 rounded-full px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
    >
      <Languages className="h-5 w-5" />
      <span className="uppercase">{language}</span>
    </button>
  );
}
