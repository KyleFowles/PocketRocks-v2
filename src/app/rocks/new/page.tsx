/* ============================================================
   FILE: src/app/rocks/new/page.tsx

   SCOPE:
   True mobile-first data-entry flow for /rocks/new:
   - Collapsed header (no hero)
   - No stepper in the content
   - Draft input dominates the viewport
   - Sticky bottom progress
   - Improve mode uses the same pattern

   KEY FIX (PERSISTENCE):
   - Create a real rockId immediately via crypto.randomUUID()
   - saveRock(uid, rockId, rock) should create/persist the doc
   - After first save, router.replace(`/rocks/${rockId}`) for stable URL

   ASSUMES:
   - useAuth at "@/lib/useAuth"
   - saveRock(uid, rockId, rock) at "@/lib/rocks"
   - /api/rock-suggest endpoint exists
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import CollapsedHeader from "@/components/rock/CollapsedHeader";
import DraftMode from "@/components/rock/DraftMode";
import ImproveMode, { type ImproveSuggestion } from "@/components/rock/ImproveMode";

import { useAuth } from "@/lib/useAuth";
import { saveRock } from "@/lib/rocks";
import type { Rock } from "@/types/rock";

type Mode = "draft" | "improve";

async function fetchSuggestion(text: string): Promise<string> {
  const res = await fetch("/api/rock-suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error("suggest_failed");
  const data = await res.json();

  const first =
    (Array.isArray(data?.suggestions) ? data.suggestions[0] : null) ??
    (typeof data?.suggestion === "string" ? data.suggestion : null) ??
    (typeof data?.text === "string" ? data.text : null);

  const cleaned = typeof first === "string" ? first.trim() : "";
  if (!cleaned) throw new Error("empty_suggestion");
  return cleaned;
}

function newId(): string {
  // Browser-safe unique id without pulling in a UUID lib
  // (crypto.randomUUID is supported in modern browsers)
  if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
    return (crypto as any).randomUUID();
  }
  // Fallback: timestamp + random
  return `rock_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function NewRockPage() {
  const router = useRouter();
  const { uid, loading } = useAuth();

  const [mode, setMode] = useState<Mode>("draft");

  const [rockId, setRockId] = useState<string | null>(null);
  const [rock, setRock] = useState<Rock | null>(null);

  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const [suggestion, setSuggestion] = useState<ImproveSuggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  // Prevent repeated routing/creating on re-renders
  const hasReplacedUrlRef = useRef(false);

  // Initialize: create rockId + local rock object immediately (fast UI)
  useEffect(() => {
    if (!uid) return;

    setRockId((prev) => prev ?? newId());

    setRock((prev) => {
      if (prev) return prev;

      const initial: any = {
        title: "",
        // Most of your code supports either "statement" or "finalStatement".
        // We'll default to "statement" here.
        statement: "",
        status: "on-track",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return initial as Rock;
    });
  }, [uid]);

  const title = (rock as any)?.title ?? "";
  const statement = (rock as any)?.statement ?? (rock as any)?.finalStatement ?? "";

  const canPersist = useMemo(() => !!uid && !!rock && !!rockId, [uid, rock, rockId]);

  async function saveNow(): Promise<void> {
    if (!canPersist) return;

    setSaving(true);
    try {
      const nextRock: any = { ...(rock as any), updatedAt: Date.now() };
      setRock(nextRock as Rock);

      await saveRock(uid!, rockId!, nextRock as Rock);
      setLastSavedAt(Date.now());

      // Once we have a persisted id, move to a stable URL.
      // This prevents losing state on refresh and aligns with /rocks/[rockId].
      if (!hasReplacedUrlRef.current) {
        hasReplacedUrlRef.current = true;
        router.replace(`/rocks/${rockId}`);
      }
    } finally {
      setSaving(false);
    }
  }

  async function enterImprove() {
    setMode("improve");

    const txt = statement?.trim();
    if (!txt) {
      setSuggestion(null);
      setSuggestionError("Write a draft first.");
      return;
    }

    setLoadingSuggestion(true);
    setSuggestionError(null);

    try {
      const s = await fetchSuggestion(txt);
      setSuggestion({ id: "rec", text: s, recommended: true });
    } catch {
      setSuggestion(null);
      setSuggestionError("Could not generate a suggestion.");
    } finally {
      setLoadingSuggestion(false);
    }
  }

  async function requestAnother() {
    const txt = statement?.trim();
    if (!txt) return;

    setLoadingSuggestion(true);
    setSuggestionError(null);

    try {
      const s = await fetchSuggestion(txt);
      setSuggestion({ id: String(Date.now()), text: s });
    } catch {
      setSuggestionError("Could not generate a suggestion.");
    } finally {
      setLoadingSuggestion(false);
    }
  }

  async function applySuggestion(nextText: string) {
    if (!rock) return;

    const nextRock: any = { ...rock };

    if (Object.prototype.hasOwnProperty.call(nextRock, "statement")) {
      nextRock.statement = nextText;
    } else {
      nextRock.finalStatement = nextText;
    }

    nextRock.updatedAt = Date.now();
    setRock(nextRock as Rock);

    // Persist immediately if we can
    if (canPersist) {
      await saveRock(uid!, rockId!, nextRock as Rock);
      setLastSavedAt(Date.now());

      if (!hasReplacedUrlRef.current) {
        hasReplacedUrlRef.current = true;
        router.replace(`/rocks/${rockId}`);
      }
    }
  }

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-white/70">Loading…</div>;
  }

  if (!uid) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-white font-semibold mb-2">Please sign in</div>
          <div className="text-white/70 text-sm mb-4">You need an account to create Rocks.</div>
          <button
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white bg-[#FF7900]"
            onClick={() => router.push("/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <CollapsedHeader
        titleLeft="Create Rock"
        titleRight={mode === "draft" ? "Draft" : "Improve"}
        rightSlot={
          mode === "improve" ? (
            <button
              type="button"
              onClick={() => setMode("draft")}
              className="text-xs text-white/60 hover:text-white transition"
            >
              Back
            </button>
          ) : lastSavedAt ? (
            <span className="text-white/55">Saved</span>
          ) : null
        }
      />

      {mode === "draft" ? (
        <DraftMode
          draft={statement}
          title={title}
          saving={saving}
          lastSavedAt={lastSavedAt}
          onChangeDraft={(next) => {
            setRock((prev: any) => {
              if (!prev) return prev;
              const hasStatement = Object.prototype.hasOwnProperty.call(prev, "statement");
              return hasStatement ? { ...prev, statement: next } : { ...prev, finalStatement: next };
            });
          }}
          onChangeTitle={(next) => setRock((prev: any) => (prev ? { ...prev, title: next } : prev))}
          onSaveNow={saveNow}
          onContinue={enterImprove}
        />
      ) : (
        <ImproveMode
          draftText={statement}
          rockTitle={title}
          suggestion={suggestion}
          loadingSuggestion={loadingSuggestion}
          suggestionError={suggestionError}
          onRequestAnother={requestAnother}
          onApplySuggestion={applySuggestion}
          onBackToDraft={() => setMode("draft")}
        />
      )}
    </div>
  );
}
