/* ============================================================
   FILE: src/components/rock/StickyBottomBar.tsx

   SCOPE:
   Fix mobile “Continue” UX + enable optional secondary action.
   - Sticky, always-visible bottom CTA (won’t fall below fold on iPhone)
   - Safe-area padding for iOS (home indicator)
   - Supports:
       * progressLabel (left/center text)
       * primaryAction (required)
       * secondaryAction (optional)  ✅ fixes TS error in ImproveMode
       * leftSlot (optional)
       * stepText (optional)
   - Uses type="button" to avoid form-submit/no-op behavior
   ============================================================ */

"use client";

import React from "react";

export type StickyAction = {
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
};

export default function StickyBottomBar(props: {
  progressLabel: string;
  stepText?: string;
  leftSlot?: React.ReactNode;
  primaryAction: StickyAction;
  secondaryAction?: StickyAction;
}) {
  const { progressLabel, stepText, leftSlot, primaryAction, secondaryAction } = props;

  const [busy, setBusy] = React.useState(false);

  async function run(action: StickyAction) {
    if (busy) return;
    if (action.disabled) return;
    try {
      setBusy(true);
      await action.onClick();
    } finally {
      setBusy(false);
    }
  }

  const primaryDisabled = !!primaryAction.disabled || busy;
  const secondaryDisabled = !!secondaryAction?.disabled || busy;

  return (
    <div
      className={[
        "fixed left-0 right-0 bottom-0 z-50",
        "border-t border-white/10",
        "bg-black/55 backdrop-blur-xl",
      ].join(" ")}
      style={{
        // iOS safe area
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
      }}
    >
      <div className="mx-auto w-full max-w-4xl px-4 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
            {leftSlot ? <div className="shrink-0">{leftSlot}</div> : null}

            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-wide text-white/60">
                {progressLabel}
              </div>
              {stepText ? (
                <div className="text-xs text-white/45 mt-0.5">{stepText}</div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {secondaryAction ? (
              <button
                type="button"
                onClick={() => run(secondaryAction)}
                disabled={secondaryDisabled}
                className={[
                  "h-11 px-4 rounded-xl",
                  "text-sm font-semibold",
                  "border border-white/10",
                  "bg-white/5 hover:bg-white/10",
                  "text-white/85",
                  secondaryDisabled ? "opacity-50 cursor-not-allowed" : "",
                ].join(" ")}
              >
                {secondaryAction.label}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => run(primaryAction)}
              disabled={primaryDisabled}
              className={[
                "h-11 px-6 rounded-xl",
                "text-sm font-semibold",
                "bg-[#FF7900] text-black",
                "hover:brightness-110",
                primaryDisabled ? "opacity-50 cursor-not-allowed" : "",
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
