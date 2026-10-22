"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { UploadCloud, CheckCircle2, XCircle } from "lucide-react";
import { useTransactions, TransactionRecord } from "@/shared/context/TransactionsContext";
import { useCompany } from "@/shared/context/CompanyContext";
import { uploadTransactionsCsv } from "@/features/transactions/services/transactionApi";
import { useToast } from "@/shared/components/Toast";
import { useLanguage } from "@/shared/context/LanguageContext";

const REQUIRED_HEADERS = ["date", "type", "category", "amount", "description"];
const TYPE_MAP: Record<string, TransactionRecord["tipo"]> = { INCOME: "INGRESO", EXPENSE: "GASTO" };
const MAX_SIZE_MB = 10;

type UploadStatus = "idle" | "validating" | "success" | "error";
type NewRecord = Omit<TransactionRecord, "id" | "batchId">;

export default function CsvDropzone() {
  const { addUpload } = useTransactions();
  const { activeCompany } = useCompany();
  const showToast = useToast();
  const { t } = useLanguage();
  const d = t.transactions.dropzone;
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function formatSize(bytes: number) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function finishWithError(file: File, errorMessage: string) {
    setStatus("error");
    setMessage(errorMessage);
    if (activeCompany) {
      addUpload(activeCompany.id, [], {
        fileName: file.name,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        size: formatSize(file.size),
        status: "Error",
        errorMessage,
      });
    }
    showToast(errorMessage, "error");
  }

  async function validateAndProcessFile(file: File) {
    setFileName(file.name);
    setStatus("validating");

    if (!file.name.toLowerCase().endsWith(".csv")) {
      finishWithError(file, d.mustBeCsv);
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      finishWithError(file, d.tooLarge(MAX_SIZE_MB));
      return;
    }
    if (!activeCompany) {
      setStatus("error");
      setMessage(d.selectCompany);
      showToast(d.selectCompany, "error");
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const headers = results.meta.fields?.map((h) => h.trim().toLowerCase()) ?? [];
        const missing = REQUIRED_HEADERS.filter((h) => h !== "description" && !headers.includes(h));

        if (missing.length > 0) {
          finishWithError(file, d.missingColumns(missing.join(", ")));
          return;
        }

        const records: NewRecord[] = [];
        for (const row of results.data) {
          const monto = parseFloat(row["amount"]);
          const tipo = TYPE_MAP[row["type"]?.trim().toUpperCase()];
          if (isNaN(monto) || !tipo) continue;
          records.push({
            fecha: row["date"],
            tipo,
            categoria: row["category"],
            monto,
            descripcion: row["description"] ?? "",
          });
        }

        if (records.length === 0) {
          finishWithError(file, d.noValidRows);
          return;
        }

        try {
          const result = await uploadTransactionsCsv(activeCompany.id, file);

          addUpload(activeCompany.id, records, {
            fileName: file.name,
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            size: formatSize(file.size),
            status: "Completed",
          });

          setStatus("success");
          setMessage(d.rowsSaved(result.recordsProcessed));
          showToast(d.rowsUploaded(result.recordsProcessed), "success");
        } catch (err) {
          finishWithError(file, err instanceof Error ? err.message : d.serverRejected);
        }
      },
      error: () => finishWithError(file, d.couldNotRead),
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndProcessFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndProcessFile(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition ${
        isDraggingOver ? "border-primary bg-primary/5" : "border-slate-300 bg-white hover:border-slate-400"
      }`}
    >
      <input ref={inputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
      <UploadCloud className="h-8 w-8 text-slate-400" strokeWidth={1.5} />

      {status === "idle" && (
        <>
          <p className="mt-3 text-sm font-medium text-slate-700">{d.prompt}</p>
          <p className="mt-1 text-xs text-slate-400">{d.maxSize(MAX_SIZE_MB)}</p>
        </>
      )}
      {status === "validating" && <p className="mt-3 text-sm font-medium text-slate-500">{d.validating(fileName)}</p>}
      {status === "success" && (
        <>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" /> {fileName}
          </p>
          <p className="mt-1 text-xs text-slate-500">{message}</p>
        </>
      )}
      {status === "error" && (
        <>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-red-600">
            <XCircle className="h-4 w-4" /> {fileName}
          </p>
          <p className="mt-1 text-xs text-red-500">{message}</p>
        </>
      )}
    </div>
  );
}