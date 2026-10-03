import { apiFetch } from "@/shared/lib/apiClient";

export interface CsvUploadResult {
  message: string;
  recordsProcessed: number;
}

export function uploadTransactionsCsv(companyId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<CsvUploadResult>(`/transactions/upload/${companyId}`, {
    method: "POST",
    body: formData,
  });
}