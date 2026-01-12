/* ============================================================
   FILE: components/rock/CollapsedHeader.tsx

   PURPOSE:
   Ultra-compact, utility-style header for data-entry screens.
   Keeps the top of the viewport clean so input can dominate.

   CONTRACT:
   - Calm is a feature
   - Data entry first
   ============================================================ */

"use client";

import React from "react";

export default function CollapsedHeader(props: {
  titleLeft: string; // e.g. "Create Rock"
  titleRight?: string; // e.g. "Draft"
  rightSlot?: React.ReactNode; // optional small control (rare)
}) {
  const { titleLeft, titleRight, rightSlot } = props;

  return (
    <div className="sticky top-0 z-20 bg-[#0b1220]/80 backdrop-blur border-b border-white/10">
      <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="text-sm tracking-wide">
          <span className="font-semibold text-white">{titleLeft}</span>
          {titleRight ? <span className="text-white/50"> · {titleRight}</span> : null}
        </div>

        {rightSlot ? <div className="text-xs text-white/60">{rightSlot}</div> : <div />}
      </div>
    </div>
  );
}
