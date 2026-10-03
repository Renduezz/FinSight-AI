import Logo from "@/shared/components/Logo";
import Footer from "@/shared/components/Footer";

export default function DataPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 px-6 py-4">
        <a href="/login"><Logo /></a>
      </header>
      <main className="mx-auto max-w-2xl flex-1 px-6 py-10 text-sm text-slate-600">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Data Policy</h1>
        <p className="mb-6 text-xs text-slate-400">Last updated: 2026</p>

        <p className="mb-4">
          FinSight AI is an academic MVP. It does not use real or sensitive financial data from
          companies to train its Machine Learning models unless explicit authorization and proper
          data handling procedures are in place.
        </p>
        <p>
          Uploaded transaction data is stored solely to generate the indicators, predictions, and
          explainability views shown within your own account, and is not shared across companies
          or users.
        </p>
      </main>
      <Footer />
    </div>
  );
}