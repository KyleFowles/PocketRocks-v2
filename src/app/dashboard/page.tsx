/* ============================================================
   FILE: src/app/dashboard/page.tsx

   FIX:
   - Stop referencing user.name (not in AuthUser)
   - Use user.displayName instead
   - Safe fallback if displayName missing
   ============================================================ */

"use client";

import React from "react";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/Button";

export default function DashboardPage() {
  const { loading, user, refresh } = useAuth();

  const display =
    (user?.displayName && user.displayName.trim()) ||
    (user?.email ?? "") ||
    "";

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Dashboard</h1>

        <div style={{ marginLeft: "auto" }}>
          <Button
            variant="secondary"
            onClick={() => refresh()}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          padding: 16,
          borderRadius: 16,
          border: "1px solid rgba(229, 232, 235, 0.15)",
          background: "rgba(20, 34, 51, 0.55)",
        }}
      >
        {loading ? (
          <div style={{ opacity: 0.9 }}>Checking sign-in…</div>
        ) : user ? (
          <>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Signed in</div>
            <div style={{ opacity: 0.9 }}>{display}</div>

            <div style={{ marginTop: 14, opacity: 0.9 }}>
              UID: <code>{user.uid}</code>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Signed out</div>
            <div style={{ opacity: 0.9 }}>
              You are not signed in right now.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
