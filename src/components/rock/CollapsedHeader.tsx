"use client";

/* ============================================================
   FILE: src/components/rock/CollapsedHeader.tsx

   SCOPE:
   PocketRocks primary header for focused creation flows.

   PROMINENCE UPDATE (LOCKED):
   - PocketRocks is the dominant visual anchor
   - Brand outweighs screen context
   - No blur, no haze, no translucency
   - Calm authority, not decoration

   DESIGN INTENT:
   When this loads, the user should instantly know:
   “I am inside PocketRocks, and this is serious work.”
   ============================================================ */

import React from "react";

export default function CollapsedHeader(props: {
  titleLeft?: string;
  titleRight?: string;
  rightSlot?: React.ReactNode;
}) {
  const { titleLeft, titleRight, rightSlot } = props;

  return (
    <header className="sticky top-0 z-40">
      {/* Solid, high-contrast surface */}
      <div className="bg-[#050b18] border-b border-white/10 shadow-[0_8px_28px_rgba(0,0,0,0.6)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          
          {/* Brand + context */}
          <div className="flex flex-col gap-1">
            {/* POCKETROCKS — PRIMARY ANCHOR */}
            <div className="flex items-baseline leading-none">
              <span className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#FF7900]">
                Pocket
              </span>
              <span className="ml-0.5 text-[22px] sm:text-[24px] font-bold tracking-tight text-white">
                Rocks
              </span>
            </div>

            {/* Context — clearly secondary */}
            {(titleLeft || titleRight) ? (
              <div className="text-[11px] uppercase tracking-wide text-white/55">
                {titleLeft}
                {titleRight ? (
                  <>
                    <span className="mx-1">·</span>
                    <span>{titleRight}</span>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Right-side status */}
          {rightSlot ? (
            <div className="text-xs text-white/60">
              {rightSlot}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
