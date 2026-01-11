"use client";

/* ============================================================
   FILE: src/app/providers.tsx

   FIX:
   - Prevent infinite "Checking sign-in…" hangs by adding a failsafe timeout.
   - Ensure onAuthStateChanged always resolves loading=false.
   - Keep auth state stable across the app.

   WHY THIS FIX WORKS:
   - If Firebase Auth never calls back (misconfig, blocked storage, etc.),
     we stop waiting and treat the user as signed out so the app can redirect to /login.

   ============================================================ */

import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";

import { getAuthClient } from "@/lib/firebase";
import { AuthContext, type AuthState } from "@/lib/useAuth";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuthClient();

    let didResolve = false;

    // ✅ Failsafe: never hang forever
    const timer = setTimeout(() => {
      if (didResolve) return;
      didResolve = true;

      console.error(
        "[Auth] onAuthStateChanged did not resolve in time. Forcing loading=false (treat as signed out)."
      );

      setUser(null);
      setLoading(false);
    }, 3500);

    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        if (didResolve) return;
        didResolve = true;

        clearTimeout(timer);
        setUser(u);
        setLoading(false);
      },
      (err) => {
        if (didResolve) return;
        didResolve = true;

        clearTimeout(timer);
        console.error("[Auth] onAuthStateChanged error:", err);

        setUser(null);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  const value = useMemo<AuthState>(() => {
    return {
      user,
      uid: user?.uid ?? null,
      loading,
      signOut: async () => {
        const auth = getAuthClient();
        await fbSignOut(auth);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
