"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/shared/context/AuthContext";
import { updateName, updateEmail } from "@/features/settings/services/settingsApi";
import { useToast } from "@/shared/components/Toast";

export default function ProfileSettingsForm() {
  const { user, refreshUser } = useAuth();
  const showToast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const nameChanged = user ? name.trim() !== user.name : false;
  const emailChanged = user ? email.trim() !== user.email : false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setSavedMessage("");

    try {
      if (emailChanged && !currentPassword) {
        showToast("Enter your current password to change your email.", "error");
        setIsSaving(false);
        return;
      }

      if (nameChanged) {
        await updateName(name.trim());
      }
      if (emailChanged) {
        await updateEmail(email.trim(), currentPassword);
      }

      await refreshUser();
      setCurrentPassword("");
      setSavedMessage("Profile updated successfully.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update profile.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">Profile information</p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        {emailChanged && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Current password <span className="text-slate-400">(required to change email)</span>
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        )}
      </div>

      {savedMessage && <p className="mt-3 text-sm text-green-600">{savedMessage}</p>}

      <button
        type="submit"
        disabled={isSaving || (!nameChanged && !emailChanged)}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}