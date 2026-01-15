/* ============================================================
   FILE: src/app/layout.tsx

   SCOPE:
   Root layout for the App Router (CHARTER SCRUB)
   - Imports globals.css exactly once (Tailwind + tokens always on)
   - Wraps the entire app in Providers (AuthContext safe)
   - Ensures dark base + text rendering are stable
   - Adds viewport meta for correct mobile scaling
   - Avoids Tailwind classes that can fight your globals.css tokens
   ============================================================ */

import "./globals.css";
import type { Metadata, Viewport } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "PocketRocks",
  description: "Smart Rocks",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Let globals.css own the background + text tokens.
          We keep body minimal so we don't "trash formatting" by overriding tokens. */}
      <body style={{ minHeight: "100dvh" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
