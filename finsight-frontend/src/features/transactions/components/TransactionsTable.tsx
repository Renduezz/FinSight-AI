"use client";

import { useState, useMemo } from "react";
import { Search, Trash2 } from "lucide-react";
import { useTransactions } from "@/shared/context/TransactionsContext";
import { useConfirm } from "@/shared/components/ConfirmDialog";
import { useToast } from "@/shared/components/Toast";
import { useLanguage } from "@/shared/context/LanguageContext";

export default function TransactionsTable() {
  const { transactions, removeTransaction } = useTransactions();
  const confirm = useConfirm();
  const showToast = useToast();
  const { t } = useLanguage();
  const tt = t.transactions.table;
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => {
        const matchesSearch =
          searchTerm === "" ||
          tx.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.descripcion.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStart = startDate === "" || tx.fecha >= startDate;
        const matchesEnd = endDate === "" || tx.fecha <= endDate;

        return matchesSearch && matchesStart && matchesEnd;
      })
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  }, [transactions, searchTerm, startDate, endDate]);

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: tt.deleteTitle,
      message: tt.deleteMessage,
      confirmLabel: t.common.delete,
      danger: true,
    });

    if (confirmed) {
      removeTransaction(id);
      showToast(tt.deleted, "success");
    }
  }

  if (transactions.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">{tt.title}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={tt.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 outline-none focus:border-primary"
        />
        <span className="text-sm text-slate-400">{tt.to}</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 outline-none focus:border-primary"
        />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
              <th className="pb-2 font-medium">{t.common.date}</th>
              <th className="pb-2 font-medium">{tt.type}</th>
              <th className="pb-2 font-medium">{tt.category}</th>
              <th className="pb-2 font-medium">{tt.description}</th>
              <th className="pb-2 font-medium text-right">{tt.amount}</th>
              <th className="pb-2 font-medium text-right">{tt.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-sm text-slate-400">
                  {tt.noMatches}
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 text-slate-600">{tx.fecha}</td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        tx.tipo === "INGRESO" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      }`}
                    >
                      {tx.tipo === "INGRESO" ? t.common.income : t.common.expense}
                    </span>
                  </td>
                  <td className="py-3 text-slate-700">{tx.categoria}</td>
                  <td className="py-3 text-slate-500">{tx.descripcion || "—"}</td>
                  <td className="py-3 text-right font-medium text-slate-700">
                    ${tx.monto.toLocaleString()}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDelete(tx.id)}
                      aria-label={tt.deleteTitle}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}