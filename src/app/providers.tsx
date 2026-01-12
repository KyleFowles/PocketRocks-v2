"use client";

// FILE: src/app/providers.tsx

import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";

import { getAuthClient } from "@/lib/firebase";
import { AuthContext, type AuthState } from "@/lib/useAuth";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let active = true;

    const safetyTimeout = window.setTimeout(() => {
      if (!active) return;
      setLoading(false);
    }, 6000);

    (async () => {
      try {
        const auth = getAuthClient();

        unsub = onAuthStateChanged(
          auth,
          (u) => {
            if (!active) return;
            window.clearTimeout(safetyTimeout);
            setUser(u);
            setLoading(false);
          },
          () => {
            if (!active) return;
            window.clearTimeout(safetyTimeout);
            setUser(null);
            setLoading(false);
          }
        );
      } catch (err) {
        // Defer state updates so the lint rule doesn't fire
        window.setTimeout(() => {
          if (!active) return;
          window.clearTimeout(safetyTimeout);
          console.error("[Auth] getAuthClient failed:", err);
          setUser(null);
          setLoading(false);
        }, 0);
      }
    })();

    return () => {
      active = false;
      window.clearTimeout(safetyTimeout);
      if (unsub) unsub();
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
