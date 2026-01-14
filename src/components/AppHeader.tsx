/* ============================================================
   FILE: src/components/AppHeader.tsx

   SCOPE:
   App header bar.
   - Uses Button variant="dangerGhost" for Logout
   - No logic changes; aligns with ButtonVariant typing
   ============================================================ */

"use client";

import React, { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/Button";
import { useAuth } from "@/lib/useAuth";

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const { user, loading, signOut } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);

  const showLogout = useMemo(() => {
    // Don’t show on login page
    if (!pathname) return false;
    if (pathname.startsWith("/login")) return false;
    return true;
  }, [pathname]);

  const statusLabel = useMemo(() => {
    if (loading) return "Loading…";
    if (!user) return "Signed out";
    return "Signed in";
  }, [user, loading]);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await signOut();
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="w-full border-b border-white/10 bg-black/20 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-white font-extrabold tracking-tight">
            PocketRocks
          </div>
          <div className="text-xs text-white/60">{statusLabel}</div>
        </div>

        <div className="flex items-center gap-2">
          {showLogout && (
            <Button
              variant="dangerGhost"
              onClick={handleLogout}
              disabled={!user || loading || loggingOut}
              title={statusLabel ?? "Logout"}
            >
              {loggingOut ? "Logging out…" : "Logout"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
