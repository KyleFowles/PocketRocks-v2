/* ============================================================
   FILE: src/components/rock/RockModes.tsx

   SCOPE:
   RockModes (Option A)
   - Remove ReviewMode import + usage
   - Keep ImproveMode working
   - "review" mode safely returns null
   ============================================================ */

"use client";

import React from "react";

import ImproveMode from "./ImproveMode";

type RockMode = "improve" | "review";

type Props = {
  mode: RockMode;
  rock: any;
  onClose?: () => void;
};

export default function RockModes({ mode, rock, onClose }: Props) {
  if (mode === "improve") {
    return (
      <ImproveMode
        rockTitle={rock?.title || "Rock"}
        draftText={rock?.statement || rock?.draft || ""}
        suggestedImprovement={rock?.suggestedImprovement || ""}
        onClose={onClose}
      />
    );
  }

  // Option A: review mode removed for now (no missing module crash)
  return null;
}
