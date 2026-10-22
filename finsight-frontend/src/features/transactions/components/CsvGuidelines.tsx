"use client";

import { useLanguage } from "@/shared/context/LanguageContext";

export default function CsvGuidelines() {
  const { t } = useLanguage();
  const g = t.transactions.guidelines;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-700">{g.title}</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-500">
        <li>• {g.format}</li>
        <li>• {g.maxSize}</li>
        <li>• {g.dateFormat}</li>
        <li>
          • {g.requiredColumns}
          <br />
          <code className="text-xs text-primary">fecha, tipo, categoria, monto, descripcion</code>
        </li>
      </ul>
    </div>
  );
}