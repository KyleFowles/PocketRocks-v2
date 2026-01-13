/* ============================================================
   FILE: src/components/rock/ImproveMode.tsx

   PURPOSE:
   Improve Mode = calm AI coaching, one suggestion at a time.
   - No editing (prevents competition)
   - One primary action: Apply
   - Sticky bottom progress + optional secondary action

   BUTTON SYSTEM + PALETTE:
   - Removes hard-coded Tailwind orange from suggestion card + badge
   - Aligns highlight + recommended badge to the mineral teal button palette
   - Keeps copy crisp and layout responsive
   ============================================================ */

"use client";

import React, { useMemo, useState } from "react";
import StickyBottomBar from "@/components/rock/StickyBottomBar";

export type ImproveSuggestion = {
  id: string;
  text: string;
  recommended?: boolean;
};

export default function ImproveMode(props: {
  draftText: string;
  rockTitle?: string;

  suggestion: ImproveSuggestion | null;
  loadingSuggestion: boolean;
  suggestionError: string | null;

  onRequestAnother: () => Promise<void>;
  onApplySuggestion: (suggestionText: string) => Promise<void>;
  onBackToDraft: () => void;
}) {
  const {
    draftText,
    rockTitle,
    suggestion,
    loadingSuggestion,
    suggestionError,
    onRequestAnother,
    onApplySuggestion,
    onBackToDraft,
  } = props;

  const [applied, setApplied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const canApply = useMemo(
    () => !!suggestion?.text && !loadingSuggestion,
    [suggestion, loadingSuggestion]
  );

  async function handleApply() {
    if (!suggestion?.text) return;
    setBusy(true);
    setApplied(false);
    setActionErr(null);
    try {
      await onApplySuggestion(suggestion.text);
      setApplied(true);
    } catch {
      setActionErr("Could not apply. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAnother() {
    setBusy(true);
    setApplied(false);
    setActionErr(null);
    try {
      await onRequestAnother();
    } catch {
      setActionErr("Could not load another suggestion.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4">
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-1 text-xs text-white/50">Your draft</div>
        <div className="mb-2 text-sm font-semibold text-white">
          {rockTitle?.trim() ? rockTitle : "Draft Rock"}
        </div>
        <div className="whitespace-pre-wrap text-sm text-white/80">
          {draftText?.trim() ? draftText : "—"}
        </div>
      </div>

      {/* Teal-highlighted suggestion card (aligned with primary button palette) */}
      <div className="rounded-2xl border border-teal-300/25 bg-teal-400/10 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-xs text-white/70">Suggested improvement</div>

          {suggestion?.recommended ? (
            <span className="rounded-full bg-teal-400/25 px-2 py-1 text-[11px] font-semibold text-white ring-1 ring-teal-200/25">
              Recommended
            </span>
          ) : null}
        </div>

        {loadingSuggestion ? (
          <div className="text-sm text-white/70">Thinking…</div>
        ) : suggestionError ? (
          <div className="text-sm text-red-200">{suggestionError}</div>
        ) : suggestion?.text ? (
          <div className="whitespace-pre-wrap text-sm text-white">{suggestion.text}</div>
        ) : (
          <div className="text-sm text-white/70">No suggestion yet.</div>
        )}

        {applied ? <div className="mt-3 text-xs text-white/85">Applied ✓</div> : null}
        {actionErr ? <div className="mt-3 text-xs text-red-200">{actionErr}</div> : null}
      </div>

      <StickyBottomBar
        progressLabel="Improve · Step 2 of 5"
        secondaryAction={{
          label: "Show another",
          onClick: handleAnother,
          disabled: busy || loadingSuggestion,
        }}
        primaryAction={{
          label: "Apply",
          onClick: handleApply,
          disabled: busy || !canApply,
        }}
      />
    </div>
  );
}
