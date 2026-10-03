"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { useCompany } from "@/shared/context/CompanyContext";

export default function Header() {
  const { companies, activeCompany, setActiveCompanyId } = useCompany();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Global search..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <select
          value={activeCompany?.id ?? ""}
          onChange={(e) => setActiveCompanyId(Number(e.target.value))}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-primary"
        >
          {companies.length === 0 && <option value="">No companies</option>}
          {companies.map((company) => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <button aria-label="Notifications" className="relative rounded-full p-2 text-slate-500 hover:bg-slate-50">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="relative">
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">JD</span>
            <span className="hidden text-left text-sm sm:block">
              <span className="block font-medium text-slate-700">Jane Doe</span>
              <span className="block text-xs text-slate-400">{activeCompany?.sector ?? "—"}</span>
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <Link href="/settings" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Settings</Link>
              <a href="/login" className="block px-4 py-2 text-sm text-red-600 hover:bg-slate-50">Log out</a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}