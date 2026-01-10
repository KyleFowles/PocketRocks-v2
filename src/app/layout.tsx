import type { Metadata } from "next";
import "./globals.css";

import AppHeader from "@/components/AppHeader";
import { BeforeNavigateProvider } from "@/components/BeforeNavigateProvider";

export const metadata: Metadata = {
  title: "PocketRocks",
  description: "SMART Rocks app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <BeforeNavigateProvider>
          <AppHeader title="Smart Rocks" />
          {children}
        </BeforeNavigateProvider>
      </body>
    </html>
  );
}
