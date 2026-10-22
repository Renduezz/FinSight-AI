"use client";

import FinancialGraphic from "./FinancialGraphic";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "@/shared/context/LanguageContext";
import Logo from "./Logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useLanguage();

  return (
    <div className="relative flex min-h-screen w-full">
      <div className="absolute right-4 top-4 z-10 rounded-full bg-white/80">
        <LanguageToggle />
      </div>

      <div className="flex w-full flex-col justify-center px-8 py-12 sm:px-16 lg:w-1/2 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <a href="/login" className="mb-10 inline-block">
            <Logo size="lg" />
          </a>

          {children}

          <p className="mt-10 text-center text-xs text-slate-400">
            {t.common.allRightsReserved}
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#EFF4FF] to-[#DCE8FF] lg:block lg:w-1/2">
        <div className="absolute inset-0">
          <FinancialGraphic />
        </div>
      </div>
    </div>
  );
}