import type { Metadata } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ServiceWorkerRegister } from "@/components/ui/ServiceWorkerRegister";

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Shofi Traders বাকির খাতা",
  description: "Shofi Traders এর জন্য সহজ ও গোছানো বাকির হিসাব।",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shofi Traders",
  },
};

export const revalidate = 3600;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn" data-theme="shofi">
      <head>
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${notoBengali.variable} antialiased`} suppressHydrationWarning>
        <AppShell>{children}</AppShell>
        <ToastProvider />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
