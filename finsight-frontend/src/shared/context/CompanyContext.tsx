"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  Company,
  CreateCompanyPayload,
} from "@/features/companies/services/companyApi";

interface CompanyContextValue {
  companies: Company[];
  activeCompany: Company | null;
  isLoading: boolean;
  error: string;
  setActiveCompanyId: (id: number) => void;
  refreshCompanies: () => Promise<void>;
  addCompany: (payload: CreateCompanyPayload) => Promise<void>;
  editCompany: (id: number, payload: CreateCompanyPayload) => Promise<void>;
  removeCompany: (id: number) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshCompanies = useCallback(async () => {
    const hasToken = typeof window !== "undefined" && localStorage.getItem("finsight_token");
    if (!hasToken) return;

    setIsLoading(true);
    setError("");
    try {
      const data = await getCompanies();
      setCompanies(data);
      if (data.length > 0 && activeCompanyId === null) {
        setActiveCompanyId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load companies.");
    } finally {
      setIsLoading(false);
    }
  }, [activeCompanyId]);

  useEffect(() => {
    refreshCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addCompany(payload: CreateCompanyPayload) {
    const newCompany = await createCompany(payload);
    setCompanies((prev) => [...prev, newCompany]);
    setActiveCompanyId(newCompany.id);
  }

  async function editCompany(id: number, payload: CreateCompanyPayload) {
    const updated = await updateCompany(id, payload);
    setCompanies((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  async function removeCompany(id: number) {
    await deleteCompany(id);
    setCompanies((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (activeCompanyId === id) {
        setActiveCompanyId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  }

  const activeCompany = companies.find((c) => c.id === activeCompanyId) ?? null;

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        isLoading,
        error,
        setActiveCompanyId,
        refreshCompanies,
        addCompany,
        editCompany,
        removeCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}