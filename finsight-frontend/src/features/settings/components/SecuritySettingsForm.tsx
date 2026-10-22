"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useConfirm } from "@/shared/components/ConfirmDialog";
import { updatePassword } from "@/features/settings/services/settingsApi";
import { useLanguage } from "@/shared/context/LanguageContext";

export default function SecuritySettingsForm() {
  const confirm = useConfirm();
  const { t } = useLanguage();
  const s = t.settings.security;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setError(s.mismatch);
      return;
    }
    if (newPassword.length < 8) {
      setError(s.tooShort);
      return;
    }

    setIsSaving(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setSuccessMessage(s.updated);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : s.couldNotUpdate);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogoutAllDevices() {
    const confirmed = await confirm({
      title: s.signOutEverywhere,
      message: s.signOutMessage,
      confirmLabel: s.signOut,
      danger: true,
    });

    if (confirmed) {
      localStorage.removeItem("finsight_token");
      window.location.href = "/login";
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-700">{s.changePassword}</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">{s.currentPassword}</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">{s.newPassword}</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">{s.confirmNewPassword}</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {successMessage && <p className="mt-3 text-sm text-green-600">{successMessage}</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {isSaving ? s.updating : s.update}
        </button>
      </form>

      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-semibold text-red-700">{s.signOutEverywhere}</p>
        <p className="mt-1 text-xs text-red-600">
          {s.signOutDescription}
        </p>
        <button
          onClick={handleLogoutAllDevices}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
        >
          <LogOut className="h-4 w-4" /> {s.logoutAll}
        </button>
      </div>
    </div>
  );
}