/* ============================================================
   FILE: src/lib/useAuth.tsx

   PURPOSE:
   Auth context + hook used across the app.

   FIXES:
   - Add `signOut` to AuthState (AppHeader expects it)
   - Add `error` to AuthState (Dashboard expects it)
   - Keep safe defaults in createContext<AuthState>({})
   - Centralize error handling: set on failures, clear on success

   SIGN-ON HARDENING (Mac + iPhone consistent):
   - Canonicalize email + uid: trim + lowercase
   - Defensive trim of password to avoid iOS autofill whitespace issues
   ============================================================ */

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type AuthUser = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
};

export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;

  // Auth actions
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

function asText(v: unknown) {
  return typeof v === "string" ? v : "";
}

function normEmail(v: unknown): string {
  const s = typeof v === "string" ? v : "";
  return s.trim().toLowerCase();
}

function normUid(v: unknown): string {
  // In this app, UID is email-based. Keep it canonical.
  return normEmail(v);
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text };
  }
}

function normalizeError(e: unknown) {
  if (e instanceof Error) return e.message || "Something went wrong.";
  const msg = asText((e as any)?.message);
  return msg || "Something went wrong.";
}

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  error: null,
  refresh: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  clearError: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const clearError = useCallback(() => {
    if (aliveRef.current) setError(null);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        if (aliveRef.current) setUser(null);
        if (aliveRef.current) setError(null); // not signed in is not an "error" state
        return;
      }

      const data = await safeJson(res);

      // Expected shape: { user: {...} } OR { uid, email, displayName }
      const u = (data?.user ?? data) as Partial<AuthUser> | null;

      if (u && typeof u === "object" && typeof (u as any).uid === "string") {
        const email = normEmail((u as any).email ?? (u as any).uid);
        const uid = normUid((u as any).uid) || email;

        if (aliveRef.current) {
          setUser({
            uid,
            email: email || null,
            displayName: (u as any).displayName ?? null,
          });
          setError(null);
        }
      } else {
        if (aliveRef.current) {
          setUser(null);
          setError(null);
        }
      }
    } catch (e) {
      if (aliveRef.current) {
        setUser(null);
        setError(normalizeError(e));
      }
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const e = normEmail(email);
        const p = typeof password === "string" ? password.trim() : "";

        const res = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: e, password: p }),
        });

        if (!res.ok) {
          const data = await safeJson(res);
          const msg = asText(data?.error) || asText(data?.message) || "Sign in failed.";
          throw new Error(msg);
        }

        if (aliveRef.current) setError(null);
        await refresh();
      } catch (e) {
        const msg = normalizeError(e);
        if (aliveRef.current) setError(msg);
        throw e;
      }
    },
    [refresh]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      try {
        const e = normEmail(email);
        const p = typeof password === "string" ? password.trim() : "";

        const res = await fetch("/api/auth/signup", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: e, password: p }),
        });

        if (!res.ok) {
          const data = await safeJson(res);
          const msg = asText(data?.error) || asText(data?.message) || "Sign up failed.";
          throw new Error(msg);
        }

        if (aliveRef.current) setError(null);
        await refresh();
      } catch (e) {
        const msg = normalizeError(e);
        if (aliveRef.current) setError(msg);
        throw e;
      }
    },
    [refresh]
  );

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      // Even if logout fails, clear local session so UI doesn’t get stuck.
      if (aliveRef.current) setError(normalizeError(e));
    } finally {
      if (aliveRef.current) {
        setUser(null);
        // keep error as-is if we set one above; otherwise clear
      }
    }
  }, []);

  useEffect(() => {
    // Initial session check
    refresh().catch(() => {
      // refresh already sets error if needed
    });
  }, [refresh]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      error,
      refresh,
      signIn,
      signUp,
      signOut,
      clearError,
    }),
    [user, loading, error, refresh, signIn, signUp, signOut, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
