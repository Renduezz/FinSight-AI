"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { register } from "@/features/auth/services/authApi";
import { isCorporateEmail } from "@/shared/lib/validators";
import { useLanguage } from "@/shared/context/LanguageContext";

export default function RegisterForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const r = t.auth.register;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isCorporateEmail(email)) {
      setError(r.corporateEmailError);
      return;
    }
    if (password !== confirmPassword) {
      setError(r.passwordsMismatch);
      return;
    }
    if (!agreedToTerms) {
      setError(r.mustAcceptTerms);
      return;
    }

    setIsSubmitting(true);
    try {
      await register(fullName, email, password);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : r.couldNotCreate);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{r.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{r.subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-slate-700">{r.fullName}</label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">{r.workEmail}</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@company.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">{t.auth.password}</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-label={t.auth.togglePassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700">{r.confirmPassword}</label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <span>
            {r.agreeTo}{" "}
            <a href="/terms" className="text-primary hover:underline">{t.footer.terms}</a>{" "}
            {r.and}{" "}
            <a href="/privacy" className="text-primary hover:underline">{t.footer.privacy}</a>.
          </span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {isSubmitting ? r.submitting : r.submit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {r.haveAccount}{" "}
        <a href="/login" className="font-medium text-primary hover:underline">{r.login}</a>
      </p>
    </div>
  );
}