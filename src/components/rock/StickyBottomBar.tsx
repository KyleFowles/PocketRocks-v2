"use client";

/* ============================================================
   FILE: src/components/rock/StickyBottomBar.tsx

   SCOPE:
   Bold, high-clarity sticky bottom bar for mobile-first flows.
   - Left: optional icon slot
   - Center: progress label (e.g., "Draft · Step 1 of 5")
   - Right/Center: ONE dominant CTA (e.g., Continue)

   UX:
   - CTA is never below the fold on iPhone
   - CTA is visually obvious when enabled
   - Disabled state is clearly disabled (no "murky maybe")
   ============================================================ */

import React from "react";

export default function StickyBottomBar(props: {
  progressLabel: string; // e.g., "Draft"
  stepText?: string; // e.g., "Step 1 of 5"
  leftSlot?: React.ReactNode; // optional icon / back
  primaryAction: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
}) {
  const { progressLabel, stepText, leftSlot, primaryAction } = props;

  const disabled = !!primaryAction.disabled;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {/* gradient base to separate from content */}
      <div className="border-t border-white/10 bg-gradient-to-b from-[#0B1220]/40 to-[#0B1220]/92 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          {/* left slot */}
          <div className="min-w-[44px] flex items-center justify-start">
            {leftSlot ? leftSlot : <div className="w-10 h-10" />}
          </div>

          {/* progress */}
          <div className="flex-1 flex flex-col items-center justify-center leading-tight">
            <div className="text-xs text-white/70 font-medium">
              {progressLabel}
              {stepText ? <span className="text-white/35"> · </span> : null}
              {stepText ? <span className="text-white/70">{stepText}</span> : null}
            </div>
          </div>

          {/* primary CTA */}
          <div className="min-w-[160px] flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (!disabled) primaryAction.onClick();
              }}
              disabled={disabled}
              className={[
                "inline-flex items-center justify-center",
                "rounded-xl px-6 py-3",
                "text-sm font-extrabold tracking-tight",
                "transition-all duration-200",
                "active:scale-[0.98]",
                disabled
                  ? "bg-[#FF7900]/25 text-white/55 ring-1 ring-white/10 shadow-none"
                  : [
                      "text-white",
                      "bg-gradient-to-r from-[#FF7900] to-[#FFB066]",
                      "ring-1 ring-[#FFC89A]/50",
                      "shadow-[0_14px_40px_rgba(255,121,0,0.55)]",
                      "hover:from-[#FF8F2A] hover:to-[#FFD0A6]",
                      "focus:outline-none focus:ring-2 focus:ring-[#FF7900]/70 focus:ring-offset-0",
                    ].join(" "),
              ].join(" ")}
            >
              {primaryAction.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
