/* ============================================================
   FILE: components/rock/StickyBottomBar.tsx

   SCOPE:
   Sticky footer actions for Rock flow.
   - Fix build error by removing unsupported Button prop: size
   - Backward compatible: accepts `hint` (new) and `progressLabel` (legacy)
   - Uses semantic Button variants (theme-driven)
   ============================================================ */

"use client";

import React from "react";
import { Button } from "@/components/Button";

type BarAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export default function StickyBottomBar({
  primaryAction,
  secondaryAction,
  hint,
  progressLabel,
}: {
  primaryAction: BarAction;
  secondaryAction?: BarAction;
  hint?: string;
  /** Legacy prop kept to prevent build breaks in older files. Prefer `hint`. */
  progressLabel?: string;
}) {
  const label = hint || progressLabel || "";

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50">
      <div className="pointer-events-auto mx-auto max-w-4xl px-4 pb-4">
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md shadow-xl">
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {label ? <div className="text-xs text-white/60">{label}</div> : null}
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              {secondaryAction ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={secondaryAction.onClick}
                  disabled={Boolean(secondaryAction.disabled || secondaryAction.loading)}
                  className="w-full sm:w-auto px-5 py-3"
                >
                  {secondaryAction.loading ? "Working…" : secondaryAction.label}
                </Button>
              ) : null}

              <Button
                type="button"
                variant="primary"
                onClick={primaryAction.onClick}
                disabled={Boolean(primaryAction.disabled || primaryAction.loading)}
                className="w-full sm:w-auto px-6 py-3"
              >
                {primaryAction.loading ? "Working…" : primaryAction.label}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* spacer so content isn't hidden behind bar */}
      <div className="h-20 sm:h-16" />
    </div>
  );
}
