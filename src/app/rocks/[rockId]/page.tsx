"use client";

/* ============================================================
   FILE: src/app/rocks/[rockId]/page.tsx

   SCOPE:
   Rock Detail page (Draft + Improve) with persistence + AI.

   BUILD FIX (Vercel):
   - Remove dependency on "@/components/rock/RockModes" which is
     failing module resolution in Vercel (Linux case-sensitive).
   - Inline the needed types + helpers:
       * RockMode
       * ImproveSuggestion
       * makeSuggestionId()
       * normalizeSuggestionText()

   SAVE SIGNATURE:
   - This project’s saveRock expects 2 args:
       saveRock(rockId, rock)

   ASSUMES:
   - getRock(uid, rockId) exists
   - saveRock(rockId, rock) exists
   - DraftMode / ImproveMode / CollapsedHeader exist
   - /api/rock-suggest exists
   ============================================================ */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

import CollapsedHeader from "@/components/rock/CollapsedHeader";
import DraftMode from "@/components/rock/DraftMode";
import ImproveMode from "@/components/rock/ImproveMode";

import { useAuth } from "@/lib/useAuth";
import { getRock, saveRock } from "@/lib/rocks";
import type { Rock } from "@/types/rock";

/* -----------------------------
   Inline shared types/helpers
------------------------------ */

type RockMode = "draft" | "improve";

export type ImproveSuggestion = {
  id: string;
  text: string;
  recommended?: boolean;
};

function makeSuggestionId(prefix: string = "s"): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = globalThis as any;
    if (c?.crypto?.randomUUID) return `${prefix}_${c.crypto.randomUUID()}`;
  } catch {
    // ignore
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeSuggestionText(input: unknown): string {
  if (typeof input !== "string") return "";
  let s = input.trim();

  // remove wrapping quotes
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'")) ||
    (s.startsWith("“") && s.endsWith("”"))
  ) {
    s = s.slice(1, -1).trim();
  }

  // strip common bullets / numbering
  s = s.replace(/^[-*•]\s+/, "");
  s = s.replace(/^\d+\.\s+/, "");

  // collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/* -----------------------------
   Suggest API parsing
------------------------------ */

type SuggestApiResponse =
  | { suggestions?: string[] }
  | { suggestion?: string }
  | { text?: string }
  | unknown;

async function fetchSuggestion(text: string): Promise<string> {
  const res = await fetch("/api/rock-suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("suggest_failed");

  const data: SuggestApiResponse = await res.json();

  const first =
    (Array.isArray((data as any)?.suggestions) ? (data as any).suggestions[0] : null) ??
    (typeof (data as any)?.suggestion === "string" ? (data as any).suggestion : null) ??
    (typeof (data as any)?.text === "string" ? (data as any).text : null);

  const cleaned = normalizeSuggestionText(first);
  if (!cleaned) throw new Error("empty_suggestion");
  return cleaned;
}

/* -----------------------------
   Page
------------------------------ */

export default function RockDetailPage() {
  const params = useParams<{ rockId: string }>();
  const rockId = params?.rockId;

  const { uid, loading } = useAuth();

  const [rock, setRock] = useState<Rock | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [mode, setMode] = useState<RockMode>("draft");

  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const [suggestion, setSuggestion] = useState<ImproveSuggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  // serialize saves
  const inflightSaveRef = useRef<Promise<void> | null>(null);

  const title = (rock as any)?.title ?? "";
  const statement = (rock as any)?.statement ?? (rock as any)?.finalStatement ?? "";

  useEffect(() => {
    if (!uid || !rockId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoadErr(null);
        const r = await getRock(uid, rockId);
        if (cancelled) return;
        setRock(r);
      } catch {
        if (cancelled) return;
        setLoadErr("Could not load this Rock.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, rockId]);

  async function saveNow(nextRock?: Rock): Promise<void> {
    if (!rockId) return;
    const toSave = nextRock ?? rock;
    if (!toSave) return;

    // serialize
    if (inflightSaveRef.current) await inflightSaveRef.current;

    setSaving(true);
    const p = (async () => {
      try {
        await saveRock(rockId, toSave);
        setLastSavedAt(Date.now());
      } finally {
        setSaving(false);
      }
    })();

    inflightSaveRef.current = p;
    await p;
    inflightSaveRef.current = null;
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
      setSuggestion({ id: makeSuggestionId("rec"), text: s, recommended: true });
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
      setSuggestion({ id: makeSuggestionId("s"), text: s });
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

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-white/70">Loading…</div>;
  }

  if (!uid) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-white font-semibold mb-2">Please sign in</div>
          <div className="text-white/70 text-sm">You need an account to view Rocks.</div>
        </div>
      </div>
    );
  }

  if (loadErr) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-white font-semibold mb-2">Error</div>
          <div className="text-white/70 text-sm">{loadErr}</div>
        </div>
      </div>
    );
  }

  if (!rock) {
    return <div className="min-h-[60vh] flex items-center justify-center text-white/70">Loading Rock…</div>;
  }

  return (
    <div className="w-full">
      <CollapsedHeader
        titleLeft="Rock"
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
              return hasStatement ? { ...prev, statement: next } : { ...prev, finalStatement: next };
            });
          }}
          onChangeTitle={(next) => setRock((prev: any) => (prev ? { ...prev, title: next } : prev))}
          onSaveNow={async () => saveNow()}
          onContinue={enterImprove}
        />
      ) : (
        <ImproveMode
          draftText={statement}
          rockTitle={title}
          suggestion={suggestion as any}
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
