"use client";

/* ============================================================
   FILE: src/components/rock/ImproveMode.tsx

   SCOPE:
   Mobile-first Improve mode content ONLY.
   - One suggestion at a time
   - No embedded StickyBottomBar (page owns sticky actions)
   - Calm, clear language

   NOTE:
   StickyBottomBar must be rendered by the page.
   ============================================================ */

import React from "react";

export type ImproveSuggestion = {
  id: string;
  text: string;
  recommended?: boolean;
};

export default function ImproveMode(props: {
  rockTitle: string;
  draftText: string;
  suggestion: ImproveSuggestion | null;
  loadingSuggestion: boolean;
  suggestionError: string | null;
  onApplySuggestion: (nextText: string) => void;
  onRequestAnother: () => void;
  onBackToDraft: () => void;
}) {
  const {
    suggestion,
    loadingSuggestion,
    suggestionError,
    onRequestAnother,
    onBackToDraft,
  } = props;

  return (
    <div className="w-full px-4 pt-6 pb-28 max-w-3xl mx-auto">
      <div className="mb-4 text-sm text-white/65">
        Review the improved version. Keep it or try another.
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        {loadingSuggestion ? (
          <div className="text-white/60 text-sm">Generating suggestion…</div>
        ) : suggestionError ? (
          <div className="text-red-400 text-sm">{suggestionError}</div>
        ) : suggestion ? (
          <>
            <div className="mb-2 text-xs uppercase tracking-wide text-white/50">
              Suggested improvement
            </div>
            <div className="text-white text-base leading-relaxed whitespace-pre-wrap">
              {suggestion.text}
            </div>
          </>
        ) : (
          <div className="text-white/60 text-sm">No suggestion available.</div>
        )}
      </div>

      {/* Light secondary controls (not sticky) */}
      <div className="mt-6 flex items-center justify-center gap-4 text-xs">
        <button
          type="button"
          onClick={onRequestAnother}
          disabled={loadingSuggestion}
          className="text-white/60 hover:text-white transition disabled:opacity-40"
        >
          Try another suggestion
        </button>

        <span className="text-white/30">·</span>

        <button
          type="button"
          onClick={onBackToDraft}
          className="text-white/60 hover:text-white transition"
        >
          Back to Draft
        </button>
      </div>
    </div>
  );
}
