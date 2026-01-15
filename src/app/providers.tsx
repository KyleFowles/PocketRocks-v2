/* ============================================================
   FILE: src/app/providers.tsx

   SCOPE:
   App-wide Providers (CHARTER SCRUB)
   - Owns AuthContext wiring in one place
   - Always provides a stable AuthState shape (including signOut)
   - Handles missing Firebase config gracefully (no crashes)
   - Applies theme once on mount
   - Never leaves the app stuck in loading state
   - Guards against null auth client (getAuthClient can return null)
   - Avoids setState after unmount (alive guard)
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";

import { getAuthClient, isFirebaseConfigured } from "@/lib/firebase";
import { AuthContext, type AuthState } from "@/lib/useAuth";
import { applyTheme, DEFAULT_THEME } from "@/lib/theme";

function devError(...args: any[]) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // Env config won’t change at runtime; memo keeps this stable.
  const firebaseReady = useMemo(() => isFirebaseConfigured(), []);

  const [uid, setUid] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Apply theme once
  useEffect(() => {
    try {
      applyTheme(DEFAULT_THEME);
    } catch (e) {
      devError("[Providers] applyTheme failed:", e);
    }
  }, []);

  // Auth subscription
  useEffect(() => {
    let alive = true;
    let unsub: (() => void) | null = null;

    // If Firebase isn't configured, stop loading and allow the app to render.
    if (!firebaseReady) {
      setUid(null);
      setUser(null);
      setLoading(false);
      return () => {};
    }

    // We are configured; we are about to subscribe.
    setLoading(true);

    try {
      const auth = getAuthClient();

      // Charter: never crash if auth is null (init failed unexpectedly).
      if (!auth) {
        setUid(null);
        setUser(null);
        setLoading(false);
        return () => {};
      }

      unsub = onAuthStateChanged(auth, (u: User | null) => {
        if (!alive) return;
        setUid(u?.uid ?? null);
        setUser(u);
        setLoading(false);
      });
    } catch (e) {
      devError("[Providers] Auth init failed:", e);
      setUid(null);
      setUser(null);
      setLoading(false);
    }

    return () => {
      alive = false;
      if (unsub) unsub();
    };
  }, [firebaseReady]);

  const value: AuthState = useMemo(
    () => ({
      uid,
      user,
      loading,
      signOut: async () => {
        // Charter: never throw from signOut when firebase isn't ready
        if (!firebaseReady) return;

        try {
          const auth = getAuthClient();
          if (!auth) return;
          await fbSignOut(auth);
        } catch (e) {
          devError("[Providers] signOut failed:", e);
          // swallow: UI can decide whether to show an error
        }
      },
    }),
    [uid, user, loading, firebaseReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
