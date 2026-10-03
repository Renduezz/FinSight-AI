"use client";

import { Trash2 } from "lucide-react";
import DashboardLayout from "@/shared/components/DashboardLayout";
import CsvDropzone from "@/features/transactions/components/CsvDropzone";
import CsvGuidelines from "@/features/transactions/components/CsvGuidelines";
import RecentUploadsTable from "@/features/transactions/components/RecentUploadsTable";
import TransactionsTable from "@/features/transactions/components/TransactionsTable";
import { useTransactions } from "@/shared/context/TransactionsContext";
import { useConfirm } from "@/shared/components/ConfirmDialog";
import { useToast } from "@/shared/components/Toast";

export default function TransactionsPage() {
  const { transactions, clearAll } = useTransactions();
  const confirm = useConfirm();
  const showToast = useToast();

  async function handleClear() {
    const confirmed = await confirm({
      title: "Clear all data",
      message: "This will remove every uploaded transaction from this session. This cannot be undone.",
      confirmLabel: "Clear data",
      danger: true,
    });

    if (confirmed) {
      clearAll();
      showToast("All data has been cleared.", "success");
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Upload</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload your financial movements to generate the analysis.
          </p>
        </div>

        {transactions.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Clear Data
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CsvDropzone />
        </div>
        <CsvGuidelines />
      </div>

      <div className="mt-6">
        <RecentUploadsTable />
      </div>

      <div className="mt-6">
        <TransactionsTable />
      </div>
    </DashboardLayout>
  );
}