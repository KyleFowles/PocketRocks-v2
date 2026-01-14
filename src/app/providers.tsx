/* ============================================================
   FILE: src/app/providers.tsx

   SCOPE:
   App Providers (Auth + Theme bootstrap)
   - Applies DEFAULT_THEME once on app load
   - Keeps existing AuthContext behavior stable
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";

import { getAuthClient } from "@/lib/firebase";
import { AuthContext, type AuthState } from "@/lib/useAuth";

import { applyTheme, DEFAULT_THEME } from "@/lib/theme";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Apply theme tokens once on startup
  useEffect(() => {
    applyTheme(DEFAULT_THEME);
  }, []);

  // ✅ Auth state
  useEffect(() => {
    const auth = getAuthClient();

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsub();
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
