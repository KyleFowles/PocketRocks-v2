/* ============================================================
   FILE: src/app/rocks/new/page.tsx

   SCOPE:
   Rebuild /rocks/new as a true mobile-first data-entry flow (Responsive):
   - Collapsed header (no hero)
   - Draft input dominates the viewport
   - Sticky bottom progress
   - Improve mode uses the same pattern

   BUILD FIX:
   Project saveRock() expects 2 arguments (not 3).
   This page now calls saveRock(rockId, rock).

   BUTTON SYSTEM:
   - Uses shared <Button> component (no Tailwind orange / hard-coded brand colors)
   - Crisp, consistent CTA styling managed in one place (src/components/Button.tsx)

   ASSUMES:
   - useAuth at "@/lib/useAuth"
   - saveRock at "@/lib/rocks" supports (rockId, rock)
   - /api/rock-suggest endpoint exists
   ============================================================ */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CollapsedHeader from "@/components/rock/CollapsedHeader";
import DraftMode from "@/components/rock/DraftMode";
import ImproveMode, { type ImproveSuggestion } from "@/components/rock/ImproveMode";

import { useAuth } from "@/lib/useAuth";
import { saveRock } from "@/lib/rocks";
import type { Rock } from "@/types/rock";
import { Button } from "@/components/Button";

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
  if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
    return (crypto as any).randomUUID();
  }
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

  // Minimal “new rock” initialization
  useEffect(() => {
    if (!uid) return;

    setRockId((prev) => prev ?? newId());

    setRock((prev) => {
      if (prev) return prev;

      const initial: any = {
        title: "",
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

  async function saveNow(nextRock?: Rock): Promise<void> {
    if (!uid || !rock || !rockId) return;

    setSaving(true);
    try {
      const toSave: any = nextRock ?? rock;
      toSave.updatedAt = Date.now();

      setRock(toSave as Rock);

      // ✅ BUILD FIX: saveRock expects 2 args in this project
      await saveRock(rockId, toSave as Rock);

      setLastSavedAt(Date.now());

      // Stable URL after first save
      router.replace(`/rocks/${rockId}`);
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
    if (rockId) {
      await saveRock(rockId, nextRock as Rock);
      setLastSavedAt(Date.now());
      router.replace(`/rocks/${rockId}`);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-white/70">
        Loading…
      </div>
    );
  }

  if (!uid) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-2 font-semibold text-white">Please sign in</div>
          <div className="mb-4 text-sm text-white/70">
            You need an account to create Rocks.
          </div>

          <Button type="button" className="w-full" onClick={() => router.push("/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <CollapsedHeader
        titleLeft="Create Rock"
        titleRight={mode === "draft" ? "Draft" : "Improve"}
        rightSlot={lastSavedAt ? <span className="text-white/55">Saved</span> : null}
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
              return hasStatement
                ? { ...prev, statement: next }
                : { ...prev, finalStatement: next };
            });
          }}
          onChangeTitle={(next) =>
            setRock((prev: any) => (prev ? { ...prev, title: next } : prev))
          }
          onSaveNow={async () => saveNow()}
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
