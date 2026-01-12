"use client";

/* ============================================================
   FILE: src/components/rock/ImproveMode.tsx

   SCOPE:
   Mobile-first Improve mode for PocketRocks.

   UX DOCTRINE (LOCKED):
   - Improve is a continuation, not a decision point
   - One suggestion at a time
   - One dominant action
   - Automatic suggestion on entry
   - Calm, neutral language (no hype, no AI theatrics)

   BEHAVIOR:
   - On mount: a suggestion is already present (handled by parent)
   - Primary CTA: "Apply & Continue"
   - Secondary action: "Try another suggestion"
   - Escape hatch: Back to Draft

   NOTES:
   - This component assumes suggestion fetching is handled upstream
     (page.tsx already does this on enterImprove)
   - This component is intentionally dumb and focused
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
    rockTitle,
    suggestion,
    loadingSuggestion,
    suggestionError,
    onApplySuggestion,
    onRequestAnother,
    onBackToDraft,
  } = props;

  return (
    <div className="w-full px-4 pt-6 pb-28 max-w-3xl mx-auto">
      {/* Context line */}
      <div className="mb-4 text-sm text-white/65">
        Review the improved version. Keep it or try another.
      </div>

      {/* Suggestion surface */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        {loadingSuggestion ? (
          <div className="text-white/60 text-sm">
            Generating suggestion…
          </div>
        ) : suggestionError ? (
          <div className="text-red-400 text-sm">
            {suggestionError}
          </div>
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
          <div className="text-white/60 text-sm">
            No suggestion available.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col items-center gap-3">
        {/* Primary action */}
        <button
          type="button"
          disabled={!suggestion || loadingSuggestion}
          onClick={() => suggestion && onApplySuggestion(suggestion.text)}
          className={`
            inline-flex items-center justify-center
            rounded-xl px-8 py-3 text-sm font-semibold
            text-white
            transition-all duration-200
            active:scale-[0.97]

            ${
              !suggestion || loadingSuggestion
                ? `
                  bg-[#FF7900]/35
                  opacity-40
                  shadow-none
                `
                : `
                  bg-gradient-to-r from-[#FF7900] to-[#FF9A3C]
                  shadow-[0_10px_40px_rgba(255,121,0,0.55)]
                  ring-1 ring-[#FFB366]/50
                  hover:from-[#FF8F2A] hover:to-[#FFB066]
                `
            }
          `}
        >
          Apply &amp; Continue
        </button>

        {/* Secondary actions */}
        <div className="flex items-center gap-4 text-xs">
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
    </div>
  );
}
