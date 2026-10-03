"use client";

import { useState } from "react";

export default function ProfileSettingsForm() {
  const [name, setName] = useState("Jane Doe");
  const [email, setEmail] = useState("jane@acmecorp.com");
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSavedMessage("");
    // Placeholder: en el futuro -> PUT /users/me
    setTimeout(() => {
      setIsSaving(false);
      setSavedMessage("Profile updated successfully.");
    }, 800);
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
      </div>

      {savedMessage && <p className="mt-3 text-sm text-green-600">{savedMessage}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}