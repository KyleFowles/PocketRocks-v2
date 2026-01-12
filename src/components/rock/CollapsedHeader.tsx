"use client";

/* ============================================================
   FILE: src/components/rock/CollapsedHeader.tsx

   SCOPE:
   Bold PocketRocks header for mobile-first flows.
   - Left: PocketRocks wordmark (Pocket = orange, Rocks = white)
   - Center: context label (e.g., "Create Rock · Draft")
   - Right: optional slot (e.g., Saved)

   UX:
   - Confident product identity without a "hero" block
   - Compact height for iPhone
   ============================================================ */

import React from "react";

export default function CollapsedHeader(props: {
  titleLeft?: string; // optional override
  titleRight?: string; // optional override
  centerText?: string; // preferred: single center line like "Create Rock · Draft"
  rightSlot?: React.ReactNode;
}) {
  const { centerText, rightSlot } = props;

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* subtle glass bar */}
      <div className="w-full border-b border-white/10 bg-[#0B1220]/70 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-3">
          {/* Left: PocketRocks wordmark */}
          <div className="flex items-center min-w-[140px]">
            <div
              className="
                select-none
                font-extrabold
                tracking-tight
                leading-none
                text-[18px]
                sm:text-[20px]
              "
              aria-label="PocketRocks"
            >
              <span className="text-[#FF7900] drop-shadow-[0_6px_18px_rgba(255,121,0,0.45)]">
                Pocket
              </span>
              <span className="text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)]">
                Rocks
              </span>
            </div>
          </div>

          {/* Center: context */}
          <div className="flex-1 flex justify-center">
            <div className="text-white/85 text-sm font-semibold tracking-tight">
              {centerText ?? "Create Rock · Draft"}
            </div>
          </div>

          {/* Right: status slot */}
          <div className="min-w-[140px] flex justify-end">
            {rightSlot ? <div className="text-xs text-white/60">{rightSlot}</div> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
