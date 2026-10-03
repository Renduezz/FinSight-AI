"use client";

import { useState } from "react";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import DashboardLayout from "@/shared/components/DashboardLayout";
import { useCompany } from "@/shared/context/CompanyContext";
import { useConfirm } from "@/shared/components/ConfirmDialog";
import { useToast } from "@/shared/components/Toast";

export default function CompaniesPage() {
  const { companies, activeCompany, setActiveCompanyId, addCompany, editCompany, removeCompany, isLoading, error } =
    useCompany();
  const confirm = useConfirm();
  const showToast = useToast();

  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  function startEditing(id: number, currentName: string, currentSector: string) {
    setEditingId(id);
    setName(currentName);
    setSector(currentSector);
    setFormError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setName("");
    setSector("");
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      if (editingId !== null) {
        await editCompany(editingId, { name, sector });
        showToast(`"${name}" was updated successfully.`, "success");
        cancelEditing();
      } else {
        await addCompany({ name, sector });
        showToast(`"${name}" was created successfully.`, "success");
        setName("");
        setSector("");
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the company.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number, companyName: string) {
    const confirmed = await confirm({
      title: "Delete company",
      message: `This will permanently delete "${companyName}" and cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });

    if (confirmed) {
      try {
        await removeCompany(id);
        showToast(`"${companyName}" was deleted.`, "success");
        if (editingId === id) cancelEditing();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Could not delete the company.", "error");
      }
    }
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
      <p className="mt-1 text-sm text-slate-500">Manage the businesses linked to your account.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            {editingId !== null ? "Edit company" : "New company"}
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Company name</label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Sector</label>
              <input
                type="text"
                required
                minLength={3}
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Retail, Technology, Services..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? "Saving..." : editingId !== null ? "Save changes" : "Create company"}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={cancelEditing}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="lg:col-span-2">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          {isLoading && <p className="text-sm text-slate-400">Loading companies...</p>}

          {!isLoading && companies.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
              No companies yet. Create your first one using the form.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {companies.map((company) => (
              <div
                key={company.id}
                className={`rounded-xl border p-4 transition ${
                  activeCompany?.id === company.id
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <button onClick={() => setActiveCompanyId(company.id)} className="w-full text-left">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-slate-800">{company.name}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{company.sector}</p>
                  {activeCompany?.id === company.id && (
                    <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Active
                    </span>
                  )}
                </button>

                <div className="mt-3 flex gap-1 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => startEditing(company.id, company.name, company.sector)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(company.id, company.name)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}