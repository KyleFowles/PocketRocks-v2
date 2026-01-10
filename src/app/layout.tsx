// FILE: src/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";

import Providers from "./providers";
import { BeforeNavigateProvider } from "@/components/BeforeNavigateProvider";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "PocketRocks",
  description: "SMART Rocks app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <Providers>
          <BeforeNavigateProvider>
            <AppHeader title="Smart Rocks" />
            {children}
          </BeforeNavigateProvider>
        </Providers>
      </body>
    </html>
  );
}
