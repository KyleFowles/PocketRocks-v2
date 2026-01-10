"use client";

// FILE: src/lib/useAuth.ts

import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

export type AuthState = {
  user: User | null;
  uid: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <Providers> (AuthContext.Provider).");
  }
  return ctx;
}
