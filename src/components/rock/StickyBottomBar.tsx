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
import { Button } from "@/components/Button";

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

          <Button
            type="button"
            onClick={primaryAction.onClick}
            disabled={isDisabled}
          >
            {primaryAction.label}
          </Button>

          {secondaryAction ? (
            <Button
              type="button"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              className="text-xs text-white/55 hover:text-white transition disabled:opacity-40"
            >
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      </div>

      {/* iOS safe-area padding */}
      <div className="h-[env(safe-area-inset-bottom)] bg-[#07101f]" />
    </div>
  );
}
