/* ============================================================
   FILE: src/app/providers.tsx

   SCOPE:
   App Providers
   - Fix AuthState typing: map Firebase User -> AuthUser (email can be null)
   - Provides AuthContext with shape: { user, loading, signOut }
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useState } from "react";

import { getAuthClient, isFirebaseConfigured } from "@/lib/firebase";
import { AuthContext, type AuthState, type AuthUser } from "@/lib/useAuth";
import { applyTheme, DEFAULT_THEME } from "@/lib/theme";

function devError(...args: any[]) {
  if (process.env.NODE_ENV !== "production") console.error(...args);
}

type Props = { children: React.ReactNode };

export default function Providers({ children }: Props) {
  const [firebaseReady, setFirebaseReady] = useState(false);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Theme init (keep existing behavior)
  useEffect(() => {
    try {
      applyTheme(DEFAULT_THEME);
    } catch {
      // ignore
    }
  }, []);

  // Firebase auth wiring
  useEffect(() => {
    let unsub: any = null;
    let alive = true;

    async function boot() {
      try {
        setLoading(true);

        if (!isFirebaseConfigured()) {
          // App can still run without Firebase configured (dev / locked down mode)
          if (!alive) return;
          setFirebaseReady(false);
          setUser(null);
          setLoading(false);
          return;
        }

        const auth = getAuthClient();
        setFirebaseReady(true);

        // Dynamic import to avoid bundling issues in some setups
        const { onAuthStateChanged } = await import("firebase/auth");

        unsub = onAuthStateChanged(auth, (fbUser) => {
          if (!alive) return;

          if (!fbUser) {
            setUser(null);
            setLoading(false);
            return;
          }

          // Map Firebase User -> AuthUser (email may be null)
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName ?? null,
          });

          setLoading(false);
        });
      } catch (e: any) {
        devError("[Providers] boot failed:", e);
        if (!alive) return;
        setFirebaseReady(false);
        setUser(null);
        setLoading(false);
      }
    }

    boot();

    return () => {
      alive = false;
      try {
        unsub?.();
      } catch {
        // ignore
      }
    };
  }, []);

  async function signOut() {
    try {
      // Clear server session cookie (if you have it)
      // Don't hard-fail if route doesn't exist yet.
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } catch {
      // ignore
    }

    try {
      if (firebaseReady && isFirebaseConfigured()) {
        const auth = getAuthClient();
        const { signOut: fbSignOut } = await import("firebase/auth");
        await fbSignOut(auth);
      }
    } catch {
      // ignore
    }

    setUser(null);
  }

  const value: AuthState = useMemo(
    () => ({
      user,
      loading,
      signOut,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
