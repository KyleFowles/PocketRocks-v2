/* ============================================================
   FILE: src/components/rock/StepMetrics.tsx

   SCOPE:
   Step 3 — Metrics (PHASE 3)
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

export default function StepMetrics({ rock, onUpdateField }: Props) {
  return (
    <div style={section}>
      <div style={sectionTitle}>Step 3 — Metrics</div>
      <div style={sectionHint}>Add 1–3 metrics you will track weekly.</div>

      <textarea
        style={textarea}
        value={safeStr(rock?.metricsText)}
        onChange={(e) => onUpdateField("metricsText", e.target.value, { autosave: true })}
        placeholder="Example: Weekly customer response time (minutes)…"
      />
    </div>
  );
}
