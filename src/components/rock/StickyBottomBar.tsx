"use client";

/* ============================================================
   FILE: src/components/rock/StickyBottomBar.tsx

   SCOPE:
   Sticky bottom action bar for PocketRocks flows.

   CLARITY UPDATE (REMOVES "SMOKE"):
   - Remove backdrop blur (major source of haze)
   - Use a crisp, near-opaque surface for the footer
   - Center primary CTA (flow continuation)
   - Strong separation via top border + subtle shadow

   UX CONTRACT:
   - One primary action
   - Progress is passive
   ============================================================ */

import React from "react";

export default function StickyBottomBar(props: {
  progressLabel: string;
  secondaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  primaryAction: { label: string; onClick: () => void; disabled?: boolean };
}) {
  const { progressLabel, secondaryAction, primaryAction } = props;
  const isDisabled = !!primaryAction.disabled;

  return (
    <div className="fixed left-0 right-0 bottom-0 z-30">
      {/* Crisp footer surface (NO blur) */}
      <div className="bg-[#07101f] border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.55)]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col items-center gap-2">
          <div className="text-xs text-white/55">{progressLabel}</div>

          <button
            type="button"
            onClick={primaryAction.onClick}
            disabled={isDisabled}
            className={[
              "inline-flex items-center justify-center",
              "rounded-xl px-10 py-3 text-sm font-semibold",
              "text-white transition-all duration-200 active:scale-[0.98]",
              isDisabled
                ? "bg-[#FF7900]/25 text-white/60"
                : "bg-[#FF7900] hover:bg-[#FF8A1A] shadow-[0_10px_35px_rgba(255,121,0,0.45)] ring-1 ring-[#FFB366]/40",
            ].join(" ")}
          >
            {primaryAction.label}
          </button>

          {secondaryAction ? (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              className="text-xs text-white/55 hover:text-white transition disabled:opacity-40"
            >
              {secondaryAction.label}
            </button>
          ) : null}
        </div>
      </div>

      {/* iOS safe-area padding */}
      <div className="h-[env(safe-area-inset-bottom)] bg-[#07101f]" />
    </div>
  );
}
