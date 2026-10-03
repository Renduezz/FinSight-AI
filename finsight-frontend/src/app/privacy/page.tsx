import Logo from "@/shared/components/Logo";
import Footer from "@/shared/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 px-6 py-4">
        <a href="/login"><Logo /></a>
      </header>
      <main className="mx-auto max-w-2xl flex-1 px-6 py-10 text-sm text-slate-600">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mb-6 text-xs text-slate-400">Last updated: 2026</p>

        <p className="mb-4">
          We collect the information you provide when creating an account (name, work email) and
          the financial data you upload for analysis (transactions, amounts, categories).
        </p>
        <p className="mb-4">
          This information is used exclusively to generate the indicators, predictions, and
          alerts offered by the platform. We do not sell your data to third parties.
        </p>
        <p>
          You may request access to or deletion of your account and associated data at any time
          by contacting your account administrator.
        </p>
      </main>
      <Footer />
    </div>
  );
}