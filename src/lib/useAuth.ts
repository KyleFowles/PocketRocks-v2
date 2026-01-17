/* ============================================================
   FILE: src/lib/useAuth.ts

   SCOPE:
   Client auth context + hook
   - Defines AuthUser email as string | null (matches Firebase User)
   - AuthState shape: { user, loading, signOut }
   ============================================================ */

"use client";

import React, { createContext, useContext } from "react";

export type AuthUser = {
  uid: string;
  email: string | null;
  name?: string | null;
};

export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
