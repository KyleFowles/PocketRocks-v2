/* ============================================================
   FILE: src/app/layout.tsx

   SCOPE:
   Root layout for the App Router.
   - Explicitly imports globals.css
   - Guarantees Tailwind + global CSS are applied
   - Wraps the entire app in Providers (AuthContext safe)
   - Establishes the canonical dark base + crisp text rendering

   THIS FILE IS FOUNDATIONAL.
   If this file is wrong, the entire app becomes unstable.
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
      <body
        className="
          min-h-dvh
          bg-transparent
          text-white
          antialiased
        "
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
