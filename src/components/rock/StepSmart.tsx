/* ============================================================
   FILE: src/components/rock/StepSmart.tsx

   SCOPE:
   Step 2 — SMART coaching (UI-only)
   - Keeps RockBuilder as the single "brain" (state + saving + navigation)
   - This component renders the Step 2 UI and calls back into RockBuilder
   ============================================================ */

"use client";

import React from "react";
import { Button } from "@/components/Button";

type Props = {
  rock: any;
  onUpdateField: (path: string, value: any) => void;
  onBuildFinal: () => void;
};

function safeStr(v: any): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return "";
  try {
    return String(v);
  } catch {
    return "";
  }
}

export default function StepSmart({ rock, onUpdateField, onBuildFinal }: Props) {
  return (
    <div style={section}>
      <div style={sectionTopRow}>
        <div>
          <div style={sectionTitle}>Step 2 — SMART coaching</div>
          <div style={sectionHint}>Answer each one in simple words. These answers become your Rock&apos;s backbone.</div>
        </div>

        <Button type="button" onClick={onBuildFinal}>
          Build Final Statement
        </Button>
      </div>

      <label style={label}>
        <div style={labelText}>Specific — What exactly will be different when this is done?</div>
        <textarea
          style={textarea}
          value={safeStr(rock?.smart?.specific)}
          onChange={(e) => onUpdateField("smart.specific", e.target.value)}
          placeholder="What will be true when this Rock is complete?"
        />
      </label>

      <label style={label}>
        <div style={labelText}>Measurable — How will you prove it is complete?</div>
        <textarea
          style={textarea}
          value={safeStr(rock?.smart?.measurable)}
          onChange={(e) => onUpdateField("smart.measurable", e.target.value)}
          placeholder="Numbers, counts, percentages, deadlines."
        />
      </label>

      <label style={label}>
        <div style={labelText}>Achievable — Why is this realistic this quarter?</div>
        <textarea
          style={textarea}
          value={safeStr(rock?.smart?.achievable)}
          onChange={(e) => onUpdateField("smart.achievable", e.target.value)}
          placeholder="Resources, capacity, scope boundaries."
        />
      </label>

      <label style={label}>
        <div style={labelText}>Relevant — Why does this matter right now?</div>
        <textarea
          style={textarea}
          value={safeStr(rock?.smart?.relevant)}
          onChange={(e) => onUpdateField("smart.relevant", e.target.value)}
          placeholder="What does it support? What problem does it solve?"
        />
      </label>

      <label style={label}>
        <div style={labelText}>Time-bound — What is the due date?</div>
        <input
          style={input}
          value={safeStr(rock?.smart?.timebound)}
          onChange={(e) => onUpdateField("smart.timebound", e.target.value)}
          placeholder="e.g., Jan 31"
        />
      </label>
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

const sectionTopRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
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

const label: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const labelText: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  opacity: 0.85,
};

const input: React.CSSProperties = {
  width: "100%",
  borderRadius: 16,
  padding: "12px 14px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "rgba(255,255,255,0.95)",
  fontSize: 16,
  outline: "none",
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
