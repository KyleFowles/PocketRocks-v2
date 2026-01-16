/* ============================================================
   FILE: src/components/rock/StepMetrics.tsx

   SCOPE:
   Step 3 — Metrics (UI-only)
   - RockBuilder remains the "brain"
   - This component renders the Step 3 UI and calls back with changes
   ============================================================ */

"use client";

import React from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
};

export default function StepMetrics({ value, onChange }: Props) {
  return (
    <div style={section}>
      <div style={sectionTitle}>Step 3 — Metrics</div>
      <div style={sectionHint}>Add 1–3 metrics you will track weekly.</div>

      <textarea
        style={textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Example: Weekly customer response time (minutes)…"
      />
    </div>
  );
}

/* -----------------------------
   Styles (temporary)
   - We’ll centralize these into builderStyles.ts in a later pass
------------------------------ */

const section: React.CSSProperties = {
  padding: "14px 18px 18px",
  display: "grid",
  gap: 14,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
};

const sectionHint: React.CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  opacity: 0.7,
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 120,
  borderRadius: 16,
  padding: "12px 14px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "rgba(255,255,255,0.95)",
  fontSize: 16,
  outline: "none",
  whiteSpace: "pre-wrap",
};
