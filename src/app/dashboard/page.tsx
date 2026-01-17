/* ============================================================
   FILE: src/app/dashboard/page.tsx

   SCOPE:
   Dashboard page
   - Fix TypeScript: useAuth() returns { user, loading }
   - Use uid from user?.uid (not top-level uid)
   ============================================================ */

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/lib/useAuth";

type RockRow = {
  id: string;
  title?: string;
  draft?: string;
  finalStatement?: string;
  updatedAt?: any;
};

function safeStr(v: any) {
  return typeof v === "string" ? v : "";
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const uid = user?.uid || "";

  const [rows, setRows] = useState<RockRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setErr(null);

        // Not signed in yet
        if (!uid) {
          if (alive) setRows([]);
          return;
        }

        const res = await fetch("/api/rocks/list", { method: "GET" });
        const data = await res.json().catch(() => ({}));

        if (!alive) return;

        if (!res.ok) {
          setErr(data?.error || "Failed to load rocks.");
          setRows([]);
          return;
        }

        const nextRows: RockRow[] = Array.isArray(data?.rows) ? data.rows : [];
        setRows(nextRows);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to load rocks.");
        setRows([]);
      }
    }

    if (!loading) load();

    return () => {
      alive = false;
    };
  }, [uid, loading]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 850, letterSpacing: 0.2 }}>Dashboard</div>
          <div style={{ opacity: 0.75, marginTop: 4 }}>
            {loading ? "Loading…" : uid ? `Signed in as ${safeStr(user?.email)}` : "Not signed in"}
          </div>
        </div>

        <Link
          href="/rocks/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            textDecoration: "none",
            fontWeight: 800,
          }}
        >
          New Rock
        </Link>
      </div>

      {err && (
        <div
          style={{
            marginTop: 16,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,120,120,0.35)",
            background: "rgba(255,80,80,0.10)",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 4 }}>Heads up</div>
          <div style={{ opacity: 0.9 }}>{err}</div>
        </div>
      )}

      <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
        {loading && (
          <div style={{ opacity: 0.75, padding: "12px 0" }}>
            Loading…
          </div>
        )}

        {!loading && !uid && (
          <div style={{ opacity: 0.75, padding: "12px 0" }}>
            Please sign in to view your Rocks.
          </div>
        )}

        {!loading && uid && rows.length === 0 && !err && (
          <div style={{ opacity: 0.75, padding: "12px 0" }}>
            No Rocks yet. Click “New Rock” to create your first one.
          </div>
        )}

        {!loading &&
          uid &&
          rows.map((r) => (
            <Link
              key={r.id}
              href={`/rocks/${encodeURIComponent(r.id)}`}
              style={{
                display: "block",
                padding: 14,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.03)",
                textDecoration: "none",
                color: "white",
              }}
            >
              <div style={{ fontWeight: 850, fontSize: 15, letterSpacing: 0.2 }}>
                {safeStr(r.title) || "Rock"}
              </div>
              <div style={{ marginTop: 6, opacity: 0.75, lineHeight: 1.35 }}>
                {safeStr(r.finalStatement) || safeStr(r.draft) || "—"}
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
