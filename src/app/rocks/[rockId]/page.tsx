/* ============================================================
   FILE: src/app/rocks/[rockId]/page.tsx

   SCOPE:
   Rock detail page — OPTION A (Single Flow) + CHARTER SCRUB
   - Safe rockId param parsing
   - Waits for auth uid
   - If URL has ?new=1:
       -> skips getRock() and opens builder with empty rock skeleton
   - Otherwise:
       -> reads via getRock(uid, rockId)
   - Normalizes arrays to prevent downstream .map crashes
   - DEV-only logs load errors
   - Prevents setState after unmount
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { useAuth } from "@/lib/useAuth";
import { getRock } from "@/lib/rocks";
import RockBuilder from "@/components/RockBuilder";

type LoadState = "idle" | "loading" | "ready" | "error";

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

function makeNewRockSkeleton(rockId: string) {
  return normalizeRock({
    id: rockId,
    title: "",
    draft: "",
    metrics: [],
    milestones: [],
  });
}

export default function RockDetailPage() {
  const params = useParams();
  const rockId = useMemo(() => firstParam((params as any)?.rockId), [params]);

  const searchParams = useSearchParams();
  const isNew = searchParams?.get("new") === "1";

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

      // OPTION A: brand-new rock should NOT read Firestore first
      if (isNew) {
        setRock(makeNewRockSkeleton(rockId));
        setLoadState("ready");
        return;
      }

      try {
        setLoadState("loading");

        const r = await getRock(uid, rockId);
        if (!alive) return;

        if (!r) {
          // Not found: treat as new (but without the ?new=1 hint)
          setRock(makeNewRockSkeleton(rockId));
          setLoadState("ready");
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

    if (!authLoading && uid && rockId) {
      run();
    }

    return () => {
      alive = false;
    };
  }, [authLoading, uid, rockId, isNew]);

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

  if (!uid || !rockId || !rock) {
    return (
      <div style={shell}>
        <div style={brand}>PocketRocks</div>
        <div style={muted}>Rock</div>

        <div style={alert}>
          <div style={alertTitle}>Heads up</div>
          <div style={alertBody}>Unable to load Rock.</div>
        </div>
      </div>
    );
  }

  return <RockBuilder uid={uid} rockId={rockId} initialRock={rock} />;
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
