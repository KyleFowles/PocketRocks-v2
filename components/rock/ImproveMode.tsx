/* ============================================================
   FILE: components/rock/ImproveMode.tsx

   PURPOSE:
   Improve Mode = calm AI coaching, one suggestion at a time.
   - No editing (prevents competition)
   - One primary action: Apply
   - Sticky bottom progress + optional secondary action

   CONTRACT:
   - AI only here
   - One suggestion visible
   - One primary action
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

  const canApply = useMemo(() => !!suggestion?.text && !loadingSuggestion, [suggestion, loadingSuggestion]);

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
    <div className="w-full max-w-3xl mx-auto px-4 pt-4 pb-28">
      {/* Context: muted, read-only */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
        <div className="text-xs text-white/50 mb-1">Your draft</div>
        <div className="text-sm text-white font-semibold mb-2">{rockTitle?.trim() ? rockTitle : "Draft Rock"}</div>
        <div className="text-sm text-white/80 whitespace-pre-wrap">{draftText?.trim() ? draftText : "—"}</div>
      </div>

      {/* Single suggestion focus */}
      <div className="rounded-2xl border border-[#FF7900]/30 bg-[#FF7900]/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-white/70">Suggested improvement</div>
          {suggestion?.recommended ? (
            <span className="text-[11px] px-2 py-1 rounded-full bg-[#FF7900] text-white font-semibold">
              Recommended
            </span>
          ) : null}
        </div>

        {loadingSuggestion ? (
          <div className="text-sm text-white/70">Thinking…</div>
        ) : suggestionError ? (
          <div className="text-sm text-red-200">{suggestionError}</div>
        ) : suggestion?.text ? (
          <div className="text-sm text-white whitespace-pre-wrap">{suggestion.text}</div>
        ) : (
          <div className="text-sm text-white/70">No suggestion yet.</div>
        )}

        {applied ? <div className="mt-3 text-xs text-white/85">Applied ✓</div> : null}
        {actionErr ? <div className="mt-3 text-xs text-red-200">{actionErr}</div> : null}
      </div>

      <StickyBottomBar
        progressLabel="Review + AI · Step 5 of 5"
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
