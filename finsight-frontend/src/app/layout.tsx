import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/shared/context/AuthContext";
import { TransactionsProvider } from "@/shared/context/TransactionsContext";
import { CompanyProvider } from "@/shared/context/CompanyContext";
import { ConfirmProvider } from "@/shared/components/ConfirmDialog";
import { ToastProvider } from "@/shared/components/Toast";
import { LanguageProvider } from "@/shared/context/LanguageContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinSight AI",
  description: "Financial intelligence platform for SMEs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <ToastProvider>
            <ConfirmProvider>
              <AuthProvider>
                <CompanyProvider>
                  <TransactionsProvider>{children}</TransactionsProvider>
                </CompanyProvider>
              </AuthProvider>
            </ConfirmProvider>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}