import type { Metadata } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/ToastProvider";

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Shofi Traders বাকির খাতা",
  description: "Shofi Traders এর জন্য সহজ ও গোছানো বাকির হিসাব।",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn" data-theme="shofi">
      <body className={`${notoBengali.variable} antialiased`}>
        <AppShell>{children}</AppShell>
        <ToastProvider />
      </body>
    </html>
  );
}
