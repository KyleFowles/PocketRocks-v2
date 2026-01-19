/* ============================================================
   FILE: src/app/dashboard/page.tsx

   SCOPE:
   Dashboard reads auth from useAuth() (client-side)
   - Shows "Checking sign-in..." while loading
   - If signed in, shows the real dashboard shell
   ============================================================ */

"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";

export default function DashboardPage() {
  const { loading, user, error, refresh } = useAuth();

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/rocks/new">New Rock</Link>
          <button
            onClick={refresh}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}>
        {loading ? (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Checking sign-in…</div>
            <div style={{ opacity: 0.85 }}>One moment.</div>
          </div>
        ) : error ? (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Auth error</div>
            <div style={{ opacity: 0.9 }}>{error}</div>
          </div>
        ) : user ? (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Signed in</div>
            <div style={{ opacity: 0.9 }}>
              {user.email} {user.name ? `(${user.name})` : ""}
            </div>

            <div style={{ marginTop: 14, opacity: 0.9 }}>
              Next step: click <b>New Rock</b> to confirm create → save → continue works.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Not signed in</div>
            <div style={{ opacity: 0.9 }}>Please sign in to view your Rocks.</div>
            <div style={{ marginTop: 10 }}>
              <Link href="/login">Go to Login</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
