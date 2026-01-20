/* ============================================================
   FILE: src/components/AppHeader.tsx

   FIX:
   - This file already expects signOut from useAuth()
   - Keep it as-is, but ensure it calls signOut safely
   ============================================================ */

"use client";

import React, { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/Button";

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const { user, loading, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const showHeader = useMemo(() => {
    // Keep header hidden on auth pages if you want (adjust as needed)
    if (!pathname) return true;
    if (pathname.startsWith("/login")) return false;
    if (pathname.startsWith("/signup")) return false;
    return true;
  }, [pathname]);

  if (!showHeader) return null;

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(10px)",
        background: "rgba(20, 34, 51, 0.85)",
        borderBottom: "1px solid rgba(229, 232, 235, 0.15)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ fontWeight: 800, letterSpacing: 0.5, color: "#E5E8EB" }}>
            PocketRocks
          </div>
          <div style={{ fontSize: 12, color: "rgba(229, 232, 235, 0.75)" }}>
            {loading ? "Checking..." : user ? user.email ?? "Signed in" : "Signed out"}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Button
            variant="secondary"
            onClick={() => router.push("/rocks")}
            disabled={loading}
          >
            Rocks
          </Button>

          <Button
            variant="primary"
            onClick={onLogout}
            disabled={loading || !user || loggingOut}
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      </div>
    </header>
  );
}
