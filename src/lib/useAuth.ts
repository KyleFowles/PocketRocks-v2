// src/lib/useAuth.ts
"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { listenForAuthChanges } from "@/lib/auth";

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let unsub: (() => void) | null = null;

    try {
      unsub = listenForAuthChanges((user) => {
        setState({ user, loading: false, error: null });
      });
    } catch (e: any) {
      // This catches "Firebase is not configured" on client if env vars are missing.
      setState({
        user: null,
        loading: false,
        error: e?.message || "Auth failed to initialize.",
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  return state;
}
