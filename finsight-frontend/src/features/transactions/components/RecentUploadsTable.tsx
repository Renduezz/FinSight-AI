"use client";

import { FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTransactions } from "@/shared/context/TransactionsContext";
import { useLanguage } from "@/shared/context/LanguageContext";

const STATUS_STYLES: Record<string, string> = {
  Completed: "bg-green-50 text-green-600",
  Processing: "bg-blue-50 text-blue-600",
  Error: "bg-red-50 text-red-600",
};

export default function RecentUploadsTable() {
  const { uploads, selectedBatchId, setSelectedBatchId } = useTransactions();
  const { t } = useLanguage();
  const u = t.transactions.uploads;

  if (uploads.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{u.title}</p>
        <p className="text-xs text-slate-400">{u.hint}</p>
      </div>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
            <th className="pb-2 font-medium">{u.fileName}</th>
            <th className="pb-2 font-medium">{t.common.date}</th>
            <th className="pb-2 font-medium">{u.size}</th>
            <th className="pb-2 font-medium">{u.status}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            onClick={() => setSelectedBatchId("all")}
            className={`cursor-pointer border-b border-slate-50 ${selectedBatchId === "all" ? "bg-primary/5" : "hover:bg-slate-50"}`}
          >
            <td className="flex items-center gap-2 py-3 font-medium text-primary" colSpan={4}>
              {selectedBatchId === "all" && <CheckCircle2 className="h-4 w-4" />}
              {u.viewAll}
            </td>
          </tr>
          {uploads.map((upload) => (
            <tr
              key={upload.batchId}
              onClick={() => upload.status === "Completed" && setSelectedBatchId(upload.batchId)}
              className={`border-b border-slate-50 last:border-0 ${
                upload.status === "Completed" ? "cursor-pointer" : "cursor-not-allowed opacity-60"
              } ${selectedBatchId === upload.batchId ? "bg-primary/5" : "hover:bg-slate-50"}`}
            >
              <td className="flex items-center gap-2 py-3 text-slate-700">
                {upload.status === "Error" ? (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                ) : (
                  <FileText className="h-4 w-4 text-slate-400" />
                )}
                {upload.fileName}
              </td>
              <td className="py-3 text-slate-500">{upload.date}</td>
              <td className="py-3 text-slate-500">{upload.size}</td>
              <td className="py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[upload.status]}`}>
                  {u.statuses[upload.status] ?? upload.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}