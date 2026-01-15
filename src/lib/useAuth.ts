"use client";

/* ============================================================
   FILE: src/lib/useAuth.ts

   SCOPE:
   AuthContext + useAuth() hook (CHARTER SCRUB)
   - Single source of truth for auth state (context-driven)
   - Dev: throws if used outside <Providers>
   - Prod: returns a safe fallback state instead of crashing the app
   - Fallback state uses loading:true (prevents false “not signed in” flashes)
   ============================================================ */

import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

export type AuthState = {
  user: User | null;
  uid: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const FALLBACK_AUTH: AuthState = {
  user: null,
  uid: null,
  // Charter: in a wiring edge-case, treat as "still loading"
  // so pages don't incorrectly show "not signed in".
  loading: true,
  signOut: async () => {
    // no-op fallback
  },
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    // Dev should fail loudly so we fix the wiring.
    if (process.env.NODE_ENV !== "production") {
      throw new Error("useAuth must be used inside <Providers> (AuthContext.Provider).");
    }

    // Prod should not crash the whole app for a wiring edge case.
    return FALLBACK_AUTH;
  }

  return ctx;
}
