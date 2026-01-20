/* ============================================================
   FILE: src/app/providers.tsx

   SCOPE:
   Global app providers
   - Auth source of truth = /api/auth/me via useAuth
   - No Firebase client auth guessing
   - Stable, predictable session behavior
   ============================================================ */

"use client";

import React from "react";
import { AuthProvider } from "@/lib/useAuth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
