"use client";

/* ============================================================
   FILE: src/components/rock/StickyBottomBar.tsx

   FINAL POLISH:
   - Motion + sizing consistent with Button system
   - Primary CTA uses size="lg" for confident continuation
   - Secondary action uses ghost (quiet, non-competing)
   - No blur, crisp surface
   ============================================================ */

import React from "react";
import { Button } from "@/components/Button";

export default function StickyBottomBar(props: {
  progressLabel: string;
  secondaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  primaryAction: { label: string; onClick: () => void; disabled?: boolean };
}) {
  const { progressLabel, secondaryAction, primaryAction } = props;

  return (
    <div className="fixed left-0 right-0 bottom-0 z-30">
      <div className="bg-[#07101f] border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.55)]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col items-center gap-2">
          <div className="text-xs text-white/55">{progressLabel}</div>

          <Button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            size="lg"
            variant="primary"
            className="w-full sm:w-auto"
          >
            {primaryAction.label}
          </Button>

          {secondaryAction ? (
            <Button
              type="button"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              size="sm"
              variant="ghost"
              className="text-xs"
            >
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="h-[env(safe-area-inset-bottom)] bg-[#07101f]" />
    </div>
  );
}
