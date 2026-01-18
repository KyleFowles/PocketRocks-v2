/* ============================================================
   FILE: src/app/rocks/[rockId]/page.tsx

   SCOPE:
   Rock detail page
   - Fix TypeScript: useAuth() returns { user, loading, signOut }
   - Fix import: use getRock (not getRockById)
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { useAuth } from "@/lib/useAuth";
import { getRock } from "@/lib/rocks";
import RockBuilder from "@/components/RockBuilder";

type LoadState = "idle" | "loading" | "loaded" | "error";

function safeStr(v: any) {
  return typeof v === "string" ? v : "";
}

export default function RockPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const rockId = useMemo(() => safeStr((params as any)?.rockId), [params]);
  const isNew = searchParams?.get("new") === "1";

  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid || "";

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [rock, setRock] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setErr(null);

        if (!uid || !rockId) {
          if (alive) {
            setRock(null);
            setLoadState("idle");
          }
          return;
        }

        setLoadState("loading");

        const doc = await getRock(uid, rockId);

        if (!alive) return;

        setRock(doc || null);
        setLoadState("loaded");
      } catch (e: any) {
        if (!alive) return;
        setLoadState("error");
        setErr(e?.message || "Failed to load rock.");
        setRock(null);
      }
    }

    if (!authLoading) load();

    return () => {
      alive = false;
    };
  }, [uid, rockId, authLoading]);

  if (authLoading) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px", opacity: 0.85 }}>
        Loading…
      </div>
    );
  }

  if (!uid) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px" }}>
        <div style={{ fontSize: 18, fontWeight: 850 }}>Please sign in</div>
        <div style={{ marginTop: 8, opacity: 0.75 }}>
          You need to be signed in to view or edit Rocks.
        </div>
      </div>
    );
  }

  if (!rockId) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px" }}>
        Missing rock id.
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px" }}>
        <div style={{ fontSize: 18, fontWeight: 850 }}>Couldn’t load Rock</div>
        <div style={{ marginTop: 8, opacity: 0.8 }}>{err || "Unknown error."}</div>
      </div>
    );
  }

  if (loadState !== "loaded" && !isNew) {
    return (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px", opacity: 0.85 }}>
        Loading…
      </div>
    );
  }

  return <RockBuilder uid={uid} rockId={rockId} initialRock={rock || undefined} />;
}
