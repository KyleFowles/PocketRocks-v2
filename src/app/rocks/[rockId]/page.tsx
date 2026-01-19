/* ============================================================
   FILE: src/app/rocks/[rockId]/page.tsx

   SCOPE:
   Rock page — stable load/create flow with Firestore LOCKED DOWN
   - Uses API routes only:
       POST /api/rocks (create with id)
       GET  /api/rocks/[rockId] (load)
       PATCH /api/rocks/[rockId] (save/update) via src/lib/rocks.ts
   - Fixes "flash then not_found" when visiting /rocks/<id>?new=1
   - Next.js 16: params/searchParams are Promises in app router pages
   - CRITICAL FIX:
       Always pass uid + rockId into RockBuilder so Step 1 gating works.
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/lib/useAuth";
import { getRock, createRockWithId } from "@/lib/rocks";
import type { Rock } from "@/types/rock";

// If your repo uses a shared builder component, keep it.
import RockBuilder from "@/components/RockBuilder";

type Props = {
  params: Promise<{ rockId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "not_found" }
  | { kind: "ready"; rock: Rock };

function toSingle(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return typeof v === "string" ? v : "";
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof (data as any)?.error === "string" ? (data as any).error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export default function RockPage(props: Props) {
  const { user, loading: authLoading } = useAuth();

  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const createdOnceRef = useRef(false);
  const mountedRef = useRef(true);

  const [rockId, setRockId] = useState<string>("");
  const [isNew, setIsNew] = useState<boolean>(false);

  // Resolve params + searchParams once.
  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      const p = await props.params;
      const sp = props.searchParams ? await props.searchParams : {};
      const newFlag = toSingle(sp?.new);

      if (!mountedRef.current) return;

      setRockId(String(p.rockId || ""));
      setIsNew(newFlag === "1" || newFlag.toLowerCase() === "true");
    })().catch(() => {
      // If something goes wrong parsing, just let load logic handle it.
      setRockId("");
      setIsNew(false);
    });

    return () => {
      mountedRef.current = false;
    };
  }, [props.params, props.searchParams]);

  // Load (and create-if-new) once auth + rockId are known.
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setState({ kind: "error", message: "Not signed in." });
      return;
    }

    if (!rockId) {
      setState({ kind: "error", message: "Missing Rock id." });
      return;
    }

    let cancelled = false;

    async function load() {
      setState({ kind: "loading" });

      // 1) If this is a new rock link, create it ONCE before loading.
      if (isNew && !createdOnceRef.current) {
        createdOnceRef.current = true;

        // Minimal initial payload. Keep it simple and stable.
        // userId is enforced server-side in API routes; safe to omit here.
        const initial: Partial<Rock> = {
          id: rockId,
          title: "",
          draft: "",
          companyId: "default",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        try {
          // Uses client lib wrapper (POST /api/rocks with id)
          await createRockWithId(user.uid, rockId, initial);
        } catch (e: any) {
          if (cancelled) return;
          setState({ kind: "error", message: e?.message || "Failed to create Rock." });
          return;
        }
      }

      // 2) Load the rock
      try {
        const r = await getRock(user.uid, rockId);
        if (cancelled) return;

        if (!r) {
          // If it was supposed to be new, try one more time to create via API directly,
          // then reload. This covers edge cases where createRockWithId is not wired.
          if (isNew) {
            try {
              await apiJson<{ ok: true; id: string }>("/api/rocks", {
                method: "POST",
                body: JSON.stringify({
                  id: rockId,
                  title: "",
                  draft: "",
                  companyId: "default",
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                }),
              });

              const r2 = await getRock(user.uid, rockId);
              if (cancelled) return;

              if (!r2) {
                setState({ kind: "not_found" });
                return;
              }

              setState({ kind: "ready", rock: r2 });
              return;
            } catch (e: any) {
              if (cancelled) return;
              setState({ kind: "error", message: e?.message || "Failed to create/load Rock." });
              return;
            }
          }

          setState({ kind: "not_found" });
          return;
        }

        setState({ kind: "ready", rock: r });
      } catch (e: any) {
        if (cancelled) return;
        setState({ kind: "error", message: e?.message || "Failed to load Rock." });
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, rockId, isNew]);

  const content = useMemo(() => {
    if (state.kind === "loading") {
      return (
        <div style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Loading Rock…</div>
          <div style={{ opacity: 0.85 }}>One moment.</div>
        </div>
      );
    }

    if (state.kind === "error") {
      return (
        <div style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Couldn’t load Rock</div>
          <div style={{ opacity: 0.9 }}>{state.message}</div>
        </div>
      );
    }

    if (state.kind === "not_found") {
      return (
        <div style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Rock not found</div>
          <div style={{ opacity: 0.9 }}>
            This Rock doesn’t exist yet. If you expected it to be created, go back and click{" "}
            <b>New Rock</b> again.
          </div>
        </div>
      );
    }

    // Ready
    // CRITICAL: pass uid + rockId so RockBuilder gating + saves work.
    return <RockBuilder uid={user?.uid || ""} rockId={rockId} initialRock={state.rock} />;
  }, [state, user, rockId]);

  return <div>{content}</div>;
}
