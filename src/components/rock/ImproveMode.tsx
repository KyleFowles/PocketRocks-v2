/* ============================================================
   FILE: src/components/rock/ImproveMode.tsx

   SCOPE:
   ImproveMode (CHARTER SCRUB)
   - Adds optional onClose prop (fixes RockModes TS error)
   - Keeps existing inputs stable
   ============================================================ */

"use client";

import React from "react";
import { Button } from "@/components/Button";

export type ImproveModeProps = {
  rockTitle: string;
  draftText: string;
  suggestedImprovement: string;

  // ✅ Added for long-term stability (used by RockModes)
  onClose?: () => void;
};

export default function ImproveMode({
  rockTitle,
  draftText,
  suggestedImprovement,
  onClose,
}: ImproveModeProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-widest text-white/50">
            IMPROVE
          </div>
          <div className="mt-1 truncate text-lg font-extrabold text-white">
            {rockTitle || "Rock"}
          </div>
        </div>

        {onClose && (
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs font-semibold tracking-widest text-white/50">
            DRAFT
          </div>
          <div className="mt-2 whitespace-pre-wrap text-sm text-white/85">
            {draftText || "—"}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs font-semibold tracking-widest text-white/50">
            SUGGESTED IMPROVEMENT
          </div>
          <div className="mt-2 whitespace-pre-wrap text-sm text-white/85">
            {suggestedImprovement || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
