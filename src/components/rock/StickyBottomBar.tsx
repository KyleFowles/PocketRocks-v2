/* ============================================================
   FILE: src/components/rock/StickyBottomBar.tsx

   SCOPE:
   Sticky bottom action bar for PocketRocks flows (Responsive).

   CLARITY UPDATE (REMOVES "SMOKE"):
   - Remove backdrop blur (major source of haze)
   - Use a crisp, near-opaque surface for the footer
   - Center primary CTA (flow continuation)
   - Strong separation via top border + subtle shadow

   BUTTON SYSTEM:
   - Uses shared <Button> component for primary + secondary actions
   - Ensures full-width primary CTA on mobile for a world-class SaaS feel
   - Secondary action uses a true "ghost" style (no orange, no hard-coded classes)

   UX CONTRACT:
   - One primary action
   - Progress is passive
   ============================================================ */

"use client";

import React from "react";
import { Button } from "@/components/Button";

export default function StickyBottomBar(props: {
  progressLabel: string;
  secondaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  primaryAction: { label: string; onClick: () => void; disabled?: boolean };
}) {
  const { progressLabel, secondaryAction, primaryAction } = props;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      {/* Crisp footer surface (NO blur) */}
      <div className="border-t border-white/10 bg-[#07101f] shadow-[0_-10px_30px_rgba(0,0,0,0.55)]">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 py-4">
          <div className="text-xs text-white/55">{progressLabel}</div>

          {/* Primary CTA: full-width on mobile, snug on desktop */}
          <Button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            className="w-full sm:w-auto"
          >
            {primaryAction.label}
          </Button>

          {secondaryAction ? (
            <Button
              type="button"
              variant="ghost"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              className="text-xs font-semibold text-white/55 hover:text-white disabled:opacity-40"
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
