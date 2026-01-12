"use client";

/* ============================================================
   FILE: src/app/rocks/new/page.tsx

   SCOPE:
   /rocks/new — bold, mobile-first data-entry flow:
   - Collapsed header with strong PocketRocks wordmark
   - Draft input dominates viewport
   - Sticky bottom progress + CTA (always visible on iPhone)
   - Continue always works (enters Improve + auto-fetch suggestion)
   - Improve uses same calm pattern

   ASSUMES:
   - useAuth at "@/lib/useAuth"
   - saveRock signature is: saveRock(rockId, rock)
   - /api/rock-suggest exists
   - Components exist:
       * DraftMode
       * ImproveMode
       * CollapsedHeader
       * StickyBottomBar
   ============================================================ */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CollapsedHeader from "@/components/rock/CollapsedHeader";
import DraftMode from "@/components/rock/DraftMode";
import ImproveMode, { type ImproveSuggestion } from "@/components/rock/ImproveMode";
import StickyBottomBar from "@/components/rock/StickyBottomBar";

import { useAuth } from "@/lib/useAuth";
import { saveRock } from "@/lib/rocks";
import type { Rock } from "@/types/rock";

type Mode = "draft" | "improve";

function makeId(): string {
  try {
    // @ts-expect-error - crypto exists in browsers
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch {
    // ignore
  }
  return `rock_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

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

export default function NewRockPage() {
  const router = useRouter();
  const { uid, loading } = useAuth();

  const [mode, setMode] = useState<Mode>("draft");

  const [rockId, setRockId] = useState<string>("");
  const [rock, setRock] = useState<Rock | null>(null);

  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const [suggestion, setSuggestion] = useState<ImproveSuggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  useEffect(() => {
    setRockId(makeId());
  }, []);

  useEffect(() => {
    if (!uid || rock) return;

    // local-first draft object for instant UI
    const initial: any = {
      title: "",
      statement: "",
      status: "on-track",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setRock(initial as Rock);
  }, [uid, rock]);

  const title = (rock as any)?.title ?? "";
  const statement = (rock as any)?.statement ?? (rock as any)?.finalStatement ?? "";

  const canContinue = statement.trim().length > 0;

  async function saveNow(nextRock?: Rock) {
    if (!rock) return;
    const toSave = nextRock ?? rock;

    if (!rockId) return;

    setSaving(true);
    try {
      await saveRock(rockId, toSave);
      setLastSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  async function enterImprove() {
    if (!rock) return;

    // persist draft before improving
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

    // Optional: after applying, you can route to the stable URL if you want:
    // router.replace(`/rocks/${rockId}`);
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

  if (!rock) {
    return <div className="min-h-[60vh] flex items-center justify-center text-white/70">Loading…</div>;
  }

  return (
    <div className="w-full">
      <CollapsedHeader
        centerText={mode === "draft" ? "Create Rock · Draft" : "Create Rock · Improve"}
        rightSlot={lastSavedAt ? <span>Saved</span> : null}
      />

      {mode === "draft" ? (
        <>
          <DraftMode
            title={title}
            draft={statement}
            onChangeTitle={(v) => setRock((prev: any) => (prev ? { ...prev, title: v } : prev))}
            onChangeDraft={(v) =>
              setRock((prev: any) => {
                if (!prev) return prev;
                const hasStatement = Object.prototype.hasOwnProperty.call(prev, "statement");
                return hasStatement ? { ...prev, statement: v } : { ...prev, finalStatement: v };
              })
            }
          />

          <StickyBottomBar
            progressLabel="Draft"
            stepText="Step 1 of 5"
            primaryAction={{
              label: "Continue",
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
              label: suggestion ? "Apply & Continue" : "Continue",
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
