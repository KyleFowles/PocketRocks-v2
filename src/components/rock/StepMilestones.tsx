/* ============================================================
   FILE: src/components/rock/StepMilestones.tsx

   SCOPE:
   Step 4 — Milestones (PHASE 3)
   - Pure UI extraction only (NO persistence logic)
   - Parent owns:
     * onUpdateField() autosave behavior
   ============================================================ */

"use client";

import React from "react";

import {
  section,
  sectionHint,
  sectionTitle,
  textarea,
} from "@/components/rock/builderStyles";

function safeStr(v: any): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return "";
  try {
    return String(v);
  } catch {
    return "";
  }
}

type Props = {
  rock: any;
  onUpdateField: (path: string, value: any, opts?: { autosave?: boolean }) => void;
};

export default function StepMilestones({ rock, onUpdateField }: Props) {
  return (
    <div style={section}>
      <div style={sectionTitle}>Step 4 — Milestones</div>
      <div style={sectionHint}>List key milestones (simple is fine).</div>

      <textarea
        style={textarea}
        value={safeStr(rock?.milestonesText)}
        onChange={(e) => onUpdateField("milestonesText", e.target.value, { autosave: true })}
        placeholder={"Example:\n- Week 1: Define process\n- Week 3: Pilot\n- Week 6: Rollout"}
      />
    </div>
  );
}
