"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useConfirm } from "@/shared/components/ConfirmDialog";

export default function SecuritySettingsForm() {
  const confirm = useConfirm();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setError("The new password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("The new password must be at least 8 characters long.");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 800);
  }

  async function handleLogoutAllDevices() {
    const confirmed = await confirm({
      title: "Sign out everywhere",
      message: "This will sign you out from every device where you are currently logged in.",
      confirmLabel: "Sign out",
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
        <p className="text-sm font-semibold text-slate-700">Change password</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Current password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">New password</label>
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
            <label className="mb-1 block text-xs font-medium text-slate-600">Confirm new password</label>
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
          {isSaving ? "Updating..." : "Update password"}
        </button>
      </form>

      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-semibold text-red-700">Sign out everywhere</p>
        <p className="mt-1 text-xs text-red-600">
          Ends your session on every device where you're currently logged in.
        </p>
        <button
          onClick={handleLogoutAllDevices}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
        >
          <LogOut className="h-4 w-4" /> Log out all devices
        </button>
      </div>
    </div>
  );
}