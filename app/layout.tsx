// app/layout.tsx
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Muscle Check Fitness | Gym Admin Dashboard",
  description: "Manage gym memberships, monthly subscriptions, and daily check-in sessions for Muscle Check Fitness.",
  keywords: ["Gym Management", "Fitness Dashboard", "Membership Tracker", "Muscle Check Fitness"],
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script
          src="https://code.responsivevoice.org/responsivevoice.js?key=FREE"
          strategy="beforeInteractive"
        />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
