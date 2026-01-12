"use client";

/* ============================================================
   FILE: src/app/rocks/[rockId]/page.tsx

   SCOPE:
   Rock Detail page aligned to the mobile-first UX pattern:
   - DraftMode is input-only (no saving/continue props)
   - StickyBottomBar owns the primary CTA (Continue / Apply)
   - Continue is always visible on iPhone
   - saveRock signature: saveRock(rockId, rock)

   ASSUMES:
   - DraftMode: "@/components/rock/DraftMode" (input-only)
   - ImproveMode: "@/components/rock/ImproveMode"
   - StickyBottomBar: "@/components/rock/StickyBottomBar"
   - CollapsedHeader: "@/components/rock/CollapsedHeader"
   - useAuth: "@/lib/useAuth"
   - getRock(uid, rockId) exists
   - saveRock(rockId, rock) exists
   - /api/rock-suggest endpoint exists
   ============================================================ */

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import CollapsedHeader from "@/components/rock/CollapsedHeader";
import DraftMode from "@/components/rock/DraftMode";
import ImproveMode, { type ImproveSuggestion } from "@/components/rock/ImproveMode";
import StickyBottomBar from "@/components/rock/StickyBottomBar";

import { useAuth } from "@/lib/useAuth";
import { getRock, saveRock } from "@/lib/rocks";
import type { Rock } from "@/types/rock";

type Mode = "draft" | "improve";

/* -----------------------------
   Suggestion fetch
------------------------------ */

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

export default function RockDetailPage() {
  const router = useRouter();
  const params = useParams<{ rockId: string }>();
  const rockId = params?.rockId;

  const { uid, loading } = useAuth();

  const [mode, setMode] = useState<Mode>("draft");

  const [rock, setRock] = useState<Rock | null>(null);
  const [loadingRock, setLoadingRock] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const [suggestion, setSuggestion] = useState<ImproveSuggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  /* -----------------------------
     Load
  ------------------------------ */
  useEffect(() => {
    if (!uid || !rockId) return;

    let cancelled = false;

    (async () => {
      setLoadingRock(true);
      setLoadErr(null);
      try {
        const r = await getRock(uid, rockId);
        if (cancelled) return;
        setRock(r as Rock);
      } catch {
        if (cancelled) return;
        setLoadErr("Could not load this Rock.");
      } finally {
        if (cancelled) return;
        setLoadingRock(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, rockId]);

  const title = (rock as any)?.title ?? "";
  const statement = (rock as any)?.statement ?? (rock as any)?.finalStatement ?? "";
  const canContinue = statement.trim().length > 0;

  /* -----------------------------
     Save
  ------------------------------ */
  async function saveNow(nextRock?: Rock) {
    if (!rockId || !rock) return;
    const toSave = nextRock ?? rock;

    setSaving(true);
    try {
      await saveRock(rockId, toSave);
      setLastSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  /* -----------------------------
     Enter Improve (auto-generate)
  ------------------------------ */
  async function enterImprove() {
    if (!rock) return;

    await saveNow(rock);

    const txt = statement.trim();
    if (!txt) return;

    setMode("improve");
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
    const txt = statement.trim();
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

    await saveNow(nextRock as Rock);
  }

  /* -----------------------------
     States
  ------------------------------ */
  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-white/70">Loading…</div>;
  }

  if (!uid) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-white font-semibold mb-2">Please sign in</div>
          <div className="text-white/70 text-sm mb-4">You need an account to view Rocks.</div>
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

  if (loadingRock) {
    return <div className="min-h-[60vh] flex items-center justify-center text-white/70">Loading Rock…</div>;
  }

  if (loadErr || !rock) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-white font-semibold mb-2">Not available</div>
          <div className="text-white/70 text-sm mb-4">{loadErr ?? "Could not load this Rock."}</div>
          <button
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/15"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <CollapsedHeader
        centerText={mode === "draft" ? "Rock · Draft" : "Rock · Improve"}
        rightSlot={lastSavedAt ? <span>Saved</span> : null}
      />

      {mode === "draft" ? (
        <>
          <DraftMode
            title={title}
            draft={statement}
            onChangeTitle={(next) =>
              setRock((prev: any) => (prev ? { ...prev, title: next, updatedAt: Date.now() } : prev))
            }
            onChangeDraft={(next) =>
              setRock((prev: any) => {
                if (!prev) return prev;
                const hasStatement = Object.prototype.hasOwnProperty.call(prev, "statement");
                const base = { ...prev, updatedAt: Date.now() };
                return hasStatement ? { ...base, statement: next } : { ...base, finalStatement: next };
              })
            }
          />

          <StickyBottomBar
            progressLabel="Draft"
            stepText="Step 1 of 5"
            primaryAction={{
              label: saving ? "Saving…" : "Continue",
              disabled: !canContinue || saving,
              onClick: enterImprove,
            }}
          />
        </>
      ) : (
        <>
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

          <StickyBottomBar
            progressLabel="Improve"
            stepText="Step 2 of 5"
            primaryAction={{
              label: suggestion ? "Apply" : "Loading…",
              disabled: loadingSuggestion || !suggestion,
              onClick: () => {
                if (suggestion) applySuggestion(suggestion.text);
              },
            }}
          />
        </>
      )}
    </div>
  );
}
