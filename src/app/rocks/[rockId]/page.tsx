/* ============================================================
   FILE: src/app/rocks/[rockId]/page.tsx

   SCOPE (THIS CHANGE):
   Replace the cluttered "everything-at-once" UX with a strict
   Draft -> Improve flow that matches the PocketRocks UX contract.

   CONTRACT ENFORCEMENT:
   - Draft mode: writing only (one primary action: Continue)
   - Improve mode: AI suggestion only (one primary action: Apply)
   - Progressive disclosure: AI only in Improve
   - Mobile-first: single-column, calm layout

   ASSUMPTIONS (based on your existing code):
   - useAuth exists at "@/lib/useAuth"
   - getRock/saveRock exist at "@/lib/rocks"
   - /api/rock-suggest exists and can accept JSON { text: string }
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "@/lib/useAuth";
import { getRock, saveRock } from "@/lib/rocks";
import type { Rock } from "@/types/rock";

import DraftMode from "@/components/rock/DraftMode";
import ImproveMode from "@/components/rock/ImproveMode";
import type { ImproveSuggestion, RockMode } from "@/components/rock/RockModes";
import { makeSuggestionId, normalizeSuggestionText } from "@/components/rock/RockModes";

type SuggestApiResponse =
  | { suggestions?: string[] }
  | { suggestion?: string }
  | { text?: string }
  | any;

async function fetchSuggestion(text: string): Promise<string> {
  const res = await fetch("/api/rock-suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Suggestion request failed: ${res.status}`);
  }

  const data: SuggestApiResponse = await res.json();

  // Accept a few common shapes to avoid brittle coupling
  const first =
    (Array.isArray(data?.suggestions) ? data.suggestions[0] : null) ??
    (typeof data?.suggestion === "string" ? data.suggestion : null) ??
    (typeof data?.text === "string" ? data.text : null);

  const cleaned = normalizeSuggestionText(first);
  if (!cleaned) throw new Error("Empty suggestion");
  return cleaned;
}

export default function RockDetailPage() {
  const router = useRouter();
  const params = useParams<{ rockId: string }>();
  const rockId = params?.rockId;

  const { uid, loading } = useAuth();

  const [mode, setMode] = useState<RockMode>("draft");

  const [rock, setRock] = useState<Rock | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loadingRock, setLoadingRock] = useState(true);

  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Improve mode suggestion state
  const [suggestion, setSuggestion] = useState<ImproveSuggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  // Prevent overlapping saves
  const saveInFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!uid || !rockId) return;

    let alive = true;
    (async () => {
      setLoadingRock(true);
      setLoadErr(null);

      try {
        const r = await getRock(uid, rockId);
        if (!alive) return;
        setRock(r);
      } catch (e: any) {
        if (!alive) return;
        setLoadErr("Could not load this Rock.");
      } finally {
        if (!alive) return;
        setLoadingRock(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [uid, rockId]);

  const title = rock?.title ?? "";
  const statement = (rock as any)?.statement ?? (rock as any)?.finalStatement ?? "";

  async function saveNow(): Promise<void> {
    if (!uid || !rockId || !rock) return;

    // Serialize saves
    if (saveInFlight.current) return saveInFlight.current;

    setSaving(true);

    const p = (async () => {
      try {
        await saveRock(uid, rockId, rock);
        setLastSavedAt(Date.now());
      } finally {
        setSaving(false);
        saveInFlight.current = null;
      }
    })();

    saveInFlight.current = p;
    return p;
  }

  async function ensureSuggestion(): Promise<void> {
    if (!statement?.trim()) {
      setSuggestion(null);
      setSuggestionError("Write a Rock statement first.");
      return;
    }

    setLoadingSuggestion(true);
    setSuggestionError(null);

    try {
      const s = await fetchSuggestion(statement);
      const sug: ImproveSuggestion = {
        id: makeSuggestionId(s),
        text: s,
        recommended: true,
      };
      setSuggestion(sug);
    } catch {
      setSuggestion(null);
      setSuggestionError("Could not generate a suggestion.");
    } finally {
      setLoadingSuggestion(false);
    }
  }

  async function enterImproveMode(): Promise<void> {
    setMode("improve");
    // Generate suggestion on entry
    await ensureSuggestion();
  }

  async function applySuggestion(sText: string): Promise<void> {
    if (!rock) return;

    // Store to the existing statement field you use
    const nextRock: Rock = {
      ...rock,
      // Prefer "statement" if present, otherwise fall back to "finalStatement"
      ...(Object.prototype.hasOwnProperty.call(rock as any, "statement")
        ? ({ statement: sText } as any)
        : ({ finalStatement: sText } as any)),
    };

    setRock(nextRock);
    await saveRock(uid!, rockId!, nextRock);
    setLastSavedAt(Date.now());
  }

  // Basic page-level states
  if (loading || loadingRock) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white/70">
        Loading…
      </div>
    );
  }

  if (loadErr || !rock) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-white font-semibold mb-2">Something went wrong</div>
          <div className="text-white/70 text-sm mb-4">{loadErr ?? "Missing Rock."}</div>
          <button
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white bg-[#FF7900]"
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
      {mode === "draft" ? (
        <DraftMode
          rockTitle={title}
          rockStatement={statement}
          saving={saving}
          lastSavedAt={lastSavedAt}
          onChangeTitle={(next) => {
            setRock((prev) => (prev ? ({ ...prev, title: next } as Rock) : prev));
          }}
          onChangeStatement={(next) => {
            setRock((prev) => {
              if (!prev) return prev;
              const hasStatement = Object.prototype.hasOwnProperty.call(prev as any, "statement");
              return hasStatement
                ? ({ ...(prev as any), statement: next } as Rock)
                : ({ ...(prev as any), finalStatement: next } as Rock);
            });
          }}
          onSaveNow={saveNow}
          onContinue={enterImproveMode}
        />
      ) : (
        <ImproveMode
          rockTitle={title}
          rockStatement={statement}
          suggestion={suggestion}
          loadingSuggestion={loadingSuggestion}
          suggestionError={suggestionError}
          onRequestAnother={ensureSuggestion}
          onApplySuggestion={applySuggestion}
          onSkip={() => setMode("draft")}
        />
      )}
    </div>
  );
}
