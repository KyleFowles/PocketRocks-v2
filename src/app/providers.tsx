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
