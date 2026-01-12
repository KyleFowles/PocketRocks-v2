/* ============================================================
   FILE: src/app/layout.tsx

   SCOPE:
   Root layout for app router.
   - Ensures globals.css is loaded globally.
   ============================================================ */

import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "PocketRocks",
  description: "Smart Rocks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
