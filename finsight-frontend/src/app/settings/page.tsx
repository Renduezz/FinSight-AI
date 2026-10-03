"use client";

import { useState } from "react";
import DashboardLayout from "@/shared/components/DashboardLayout";
import ProfileSettingsForm from "@/features/settings/components/ProfileSettingsForm";
import SecuritySettingsForm from "@/features/settings/components/SecuritySettingsForm";

type Tab = "profile" | "security";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">Manage your profile and security preferences.</p>

      {/* Pestañas */}
      <div className="mt-6 flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "profile"
              ? "border-b-2 border-primary text-primary"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "security"
              ? "border-b-2 border-primary text-primary"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Security
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "profile" ? <ProfileSettingsForm /> : <SecuritySettingsForm />}
      </div>
    </DashboardLayout>
  );
}