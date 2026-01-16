/* ============================================================
   FILE: src/components/rock/StepReviewAI.tsx

   SCOPE:
   Step 5 — Review + AI (PHASE 3)
   - Pure UI extraction only (NO persistence logic)
   - Parent owns:
     * onUpdateField() autosave behavior
   ============================================================ */

"use client";

import React from "react";

import {
  label,
  labelText,
  section,
  sectionHint,
  sectionTitle,
  textarea,
  tinyError,
  tip,
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
  aiError?: string | null;
  onUpdateField: (path: string, value: any, opts?: { autosave?: boolean }) => void;
};

export default function StepReviewAI({ rock, aiError = null, onUpdateField }: Props) {
  return (
    <div style={section}>
      <div style={sectionTitle}>Step 5 — Review + AI</div>
      <div style={sectionHint}>Review your Rock. Your AI suggestion (if any) is here.</div>

      <label style={label}>
        <div style={labelText}>Final Rock statement</div>
        <textarea
          style={textarea}
          value={safeStr(rock?.finalStatement)}
          onChange={(e) => onUpdateField("finalStatement", e.target.value, { autosave: true })}
          placeholder="This is what you’ll share with your leadership team."
        />
      </label>

      <label style={label}>
        <div style={labelText}>Suggested Improvement (from AI)</div>
        <textarea
          style={textarea}
          value={safeStr(rock?.suggestedImprovement)}
          onChange={(e) => onUpdateField("suggestedImprovement", e.target.value, { autosave: true })}
          placeholder="AI suggestion will appear here after you click Improve with AI."
        />
        {aiError ? <div style={tinyError}>{aiError}</div> : null}
        <div style={tip}>Tip: Keep it simple. Make it clearer, not perfect.</div>
      </label>
    </div>
  );
}
