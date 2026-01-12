/* ============================================================
   FILE: components/rock/StickyBottomBar.tsx

   PURPOSE:
   Sticky bottom bar that combines:
   - Progress (left)
   - Single primary action (right)
   - Optional secondary text action (left/middle)

   CONTRACT:
   - Stepper removed from vertical flow
   - One primary action
   - Mobile-first (safe-area friendly)
   ============================================================ */

"use client";

import React from "react";

export default function StickyBottomBar(props: {
  progressLabel: string; // e.g. "Draft · Step 1 of 5"
  secondaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  primaryAction: { label: string; onClick: () => void; disabled?: boolean };
}) {
  const { progressLabel, secondaryAction, primaryAction } = props;

  return (
    <div className="fixed left-0 right-0 bottom-0 z-30 bg-[#0b1220]/92 backdrop-blur border-t border-white/10">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="text-xs text-white/55 whitespace-nowrap">{progressLabel}</div>

        {secondaryAction ? (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
            className="text-sm text-white/60 hover:text-white transition disabled:opacity-40"
          >
            {secondaryAction.label}
          </button>
        ) : (
          <div className="flex-1" />
        )}

        <button
          type="button"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className="ml-auto inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-[#FF7900] hover:bg-[#ff8a1a] active:scale-[0.99] transition shadow-lg shadow-[#FF7900]/20 disabled:opacity-40 disabled:hover:bg-[#FF7900]"
        >
          {primaryAction.label}
        </button>
      </div>

      {/* iOS safe-area padding */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
