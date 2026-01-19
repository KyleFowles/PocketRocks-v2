/* ============================================================
   FILE: src/lib/useAuth.ts

   SCOPE:
   Shared Auth Context + Hook (source of truth = /api/auth/me)
   - Keeps existing app wiring via AuthContext (providers.tsx)
   - Uses cookies (credentials: include)
   - No caching (cache: no-store)
   - Provides refresh() for UI
   ============================================================ */

"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

export type AuthUser = {
  uid: string;
  email: string;
  name?: string;
};

export type AuthState = {
  loading: boolean;
  user: AuthUser | null;
  error: string | null;
  refresh: () => Promise<void>;
};

async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });

  // Many setups return 200 with { user:null }, but some use 401.
  if (res.status === 401) return null;

  const data = (await res.json()) as { ok?: boolean; user?: AuthUser | null };
  return data?.user ?? null;
}

export const AuthContext = createContext<AuthState>({
  loading: true,
  user: null,
  error: null,
  // default no-op; real impl provided by provider
  refresh: async () => {},
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/**
 * Optional helper provider if you want to use it directly.
 * (If your app already has an AuthProvider in providers.tsx, you can ignore this.)
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = async () => {
    setError(null);
    try {
      const u = await fetchMe();
      if (!mounted.current) return;
      setUser(u);
    } catch (e: any) {
      if (!mounted.current) return;
      setError(e?.message || "Auth check failed");
      setUser(null);
    } finally {
      if (!mounted.current) return;
      setLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    refresh();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthState>(() => ({ loading, user, error, refresh }), [loading, user, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
