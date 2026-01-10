/* ============================================================
   File: src/app/providers.tsx
   Purpose:
   - Client-side wrapper for app-wide providers (AuthProvider)
   ============================================================ */

"use client";

import React from "react";
import { AuthProvider } from "@/lib/auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
