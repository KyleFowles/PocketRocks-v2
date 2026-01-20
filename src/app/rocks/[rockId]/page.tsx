/* ============================================================
   FILE: src/app/rocks/[rockId]/page.tsx

   SCOPE:
   Rock Detail / Builder Route
   - Fix TS: user possibly null (build blocker)
   - World-class flow:
     - If user missing: route to /login (no partial writes)
     - If ?new=1: create rock once, then replace URL to remove new=1
     - Load rock data safely before rendering builder
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import RockBuilder from "@/components/RockBuilder";
import { Button } from "@/components/Button";

import { useAuth } from "@/lib/useAuth";
import { createRockWithId } from "@/lib/rocks";

function safeTrim(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

type LoadState = "loading" | "ready" | "error";

export default function RockPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const rockId = useMemo(() => safeTrim((params as any)?.rockId), [params]);
  const isNew = useMemo(() => safeTrim(searchParams?.get("new")) === "1", [searchParams]);

  const { user, loading: authLoading } = useAuth();

  const [state, setState] = useState<LoadState>("loading");
  const [err, setErr] = useState<string | null>(null);

  const [initialRock, setInitialRock] = useState<any>(null);

  // Guard to prevent double-create in React strict mode / rerenders
  const createdOnceRef = useRef(false);

  // ---------- Helper: Load rock via API ----------
  async function loadRock(uid: string, id: string) {
    const res = await fetch(`/api/rocks/${id}`, { method: "GET" });
    if (!res.ok) throw new Error(`Failed to load rock (${res.status}).`);
    const data = await res.json();
    // The API may return null/undefined or missing shape — normalize lightly.
    return data || { id, userId: uid };
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setErr(null);
      setState("loading");

      const id = rockId;
      if (!id) {
        setErr("Missing rock id.");
        setState("error");
        return;
      }

      // Wait for auth to resolve
      if (authLoading) return;

      // If not signed in, route to login (world-class: no partial writes)
      if (!user || !safeTrim(user.uid)) {
        router.push("/login");
        return;
      }

      const uid = user.uid;

      try {
        // If URL indicates "new", create once, then remove the flag from URL.
        if (isNew && !createdOnceRef.current) {
          createdOnceRef.current = true;

          const initial = {
            id,
            userId: uid,
            step: 1,
            title: "",
            draft: "",
            metrics: [],
            milestones: [],
          };

          await createRockWithId(uid, id, initial);

          // ✅ stop treating this as "new" going forward.
          // This prevents surprise “jump back” behavior.
          router.replace(`/rocks/${id}`);
        }

        const loaded = await loadRock(uid, id);

        if (cancelled) return;

        setInitialRock(loaded);
        setState("ready");
      } catch (e: any) {
        if (cancelled) return;
        setErr(e?.message || "Something went wrong.");
        setState("error");
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [rockId, isNew, authLoading, user, router]);

  if (state === "loading") {
    return (
      <div className="pr-page" style={{ padding: 22 }}>
        <div style={{ opacity: 0.8, fontWeight: 800 }}>Loading Rock…</div>
        <div style={{ opacity: 0.6, marginTop: 6, fontSize: 13 }}>
          Getting your data ready.
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="pr-page" style={{ padding: 22 }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Couldn’t load this Rock</div>
        <div style={{ opacity: 0.75, marginTop: 8 }}>{err || "Unknown error."}</div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button type="button" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
          <Button type="button" onClick={() => router.refresh()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // READY
  return (
    <RockBuilder
      uid={safeTrim(user?.uid)}
      rockId={rockId}
      initialRock={initialRock}
    />
  );
}
