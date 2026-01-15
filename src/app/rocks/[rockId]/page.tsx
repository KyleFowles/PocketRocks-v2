/* ============================================================
   FILE: src/app/rocks/[rockId]/page.tsx

   SCOPE:
   Rock detail page — CHARTER SCRUB (Golden Path)
   - Pulls rockId from route params safely
   - Waits for auth uid (and clearly handles "not signed in")
   - Reads via getRock(uid, rockId)
   - Normalizes arrays to prevent downstream .map crashes (no mutation)
   - Passes uid + rockId into RockBuilder
   - DEV-only logs raw load errors for fast debugging
   - Prevents setState after unmount (alive guard)
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { useAuth } from "@/lib/useAuth";
import { getRock } from "@/lib/rocks";
import RockBuilder from "@/components/RockBuilder";

type LoadState = "idle" | "loading" | "ready" | "notfound" | "error";

function devError(...args: any[]) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
}

function firstParam(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
}

function normalizeRock(r: any) {
  if (!r || typeof r !== "object") return r;

  return {
    ...r,
    metrics: Array.isArray((r as any).metrics) ? (r as any).metrics : [],
    milestones: Array.isArray((r as any).milestones) ? (r as any).milestones : [],
  };
}

export default function RockDetailPage() {
  const params = useParams();
  const rockId = useMemo(() => firstParam((params as any)?.rockId), [params]);

  const { uid, loading: authLoading } = useAuth();

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [rock, setRock] = useState<any>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const missingRockId = !rockId;
  const notSignedIn = !authLoading && !uid;

  // Reset state whenever the target rock changes (prevents stale UI)
  useEffect(() => {
    setRock(null);
    setLoadErr(null);
    setLoadState("idle");
  }, [rockId]);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoadErr(null);

      if (!rockId) {
        setLoadState("error");
        setLoadErr("Missing rockId in the URL.");
        return;
      }

      if (!uid) {
        // Auth finished but no uid: UI will show sign-in required.
        return;
      }

      try {
        setLoadState("loading");

        const r = await getRock(uid, rockId);
        if (!alive) return;

        if (!r) {
          setRock(null);
          setLoadState("notfound");
          return;
        }

        setRock(normalizeRock(r));
        setLoadState("ready");
      } catch (e: any) {
        if (!alive) return;

        devError("[RockDetailPage] getRock failed:", e);

        setRock(null);
        setLoadState("error");
        setLoadErr(typeof e?.message === "string" ? e.message : "Failed to load rock.");
      }
    }

    // Only fetch when auth is finished and we have both uid + rockId
    if (!authLoading && uid && rockId) {
      run();
    }

    return () => {
      alive = false;
    };
  }, [authLoading, uid, rockId]);

  // ---- UI states ----

  if (authLoading || loadState === "loading") {
    return (
      <div style={shell}>
        <div style={brand}>PocketRocks</div>
        <div style={muted}>Loading…</div>
      </div>
    );
  }

  if (missingRockId) {
    return (
      <div style={shell}>
        <div style={brand}>PocketRocks</div>
        <div style={muted}>Rock</div>

        <div style={alert}>
          <div style={alertTitle}>Heads up</div>
          <div style={alertBody}>Missing rockId in the URL.</div>
        </div>
      </div>
    );
  }

  if (notSignedIn) {
    return (
      <div style={shell}>
        <div style={brand}>PocketRocks</div>
        <div style={muted}>Rock</div>

        <div style={alertWarn}>
          <div style={alertTitle}>Sign in required</div>
          <div style={alertBody}>Please sign in to view this Rock.</div>
        </div>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div style={shell}>
        <div style={brand}>PocketRocks</div>
        <div style={muted}>Rock</div>

        <div style={alert}>
          <div style={alertTitle}>Heads up</div>
          <div style={alertBody}>{loadErr || "Failed to load rock."}</div>
        </div>
      </div>
    );
  }

  if (loadState === "notfound" || !rock) {
    return (
      <div style={shell}>
        <div style={brand}>PocketRocks</div>
        <div style={muted}>Rock</div>

        <div style={alert}>
          <div style={alertTitle}>Heads up</div>
          <div style={alertBody}>Rock not found.</div>
        </div>
      </div>
    );
  }

  return <RockBuilder uid={uid!} rockId={rockId} initialRock={rock} />;
}

/* -----------------------------
   Minimal page styling
------------------------------ */

const shell: React.CSSProperties = {
  minHeight: "100vh",
  padding: "28px 22px",
  background:
    "radial-gradient(1000px 520px at 20% 20%, rgba(60,130,255,0.20), transparent 60%), radial-gradient(900px 480px at 70% 30%, rgba(255,120,0,0.12), transparent 60%), #050812",
  color: "rgba(255,255,255,0.92)",
};

const brand: React.CSSProperties = {
  fontSize: 44,
  fontWeight: 900,
  letterSpacing: -0.5,
};

const muted: React.CSSProperties = {
  marginTop: 6,
  opacity: 0.65,
};

const alert: React.CSSProperties = {
  marginTop: 22,
  maxWidth: 980,
  padding: 18,
  borderRadius: 18,
  border: "1px solid rgba(255,80,80,0.35)",
  background: "rgba(255,80,80,0.10)",
};

const alertWarn: React.CSSProperties = {
  marginTop: 22,
  maxWidth: 980,
  padding: 18,
  borderRadius: 18,
  border: "1px solid rgba(255,200,80,0.35)",
  background: "rgba(255,200,80,0.10)",
};

const alertTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  marginBottom: 6,
};

const alertBody: React.CSSProperties = {
  fontSize: 16,
  opacity: 0.9,
};
