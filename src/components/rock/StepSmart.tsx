/* ============================================================
   FILE: src/components/rock/StepSmart.tsx

   SCOPE:
   Step 2 — SMART coaching (PHASE 2)
   - Pure UI extraction only (NO persistence logic)
   - Parent owns:
     * updateField() autosave behavior
     * buildFinalFromSmart() behavior
   ============================================================ */

"use client";

import React from "react";
import { Button } from "@/components/Button";

import {
  input,
  label,
  labelText,
  section,
  sectionHint,
  sectionTitle,
  sectionTopRow,
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

  onBuildFinalStatement: () => void;
  onUpdateField: (path: string, value: any, opts?: { autosave?: boolean }) => void;
};

export default function StepSmart({ rock, onBuildFinalStatement, onUpdateField }: Props) {
  return (
    <div style={section}>
      <div style={sectionTopRow}>
        <div>
          <div style={sectionTitle}>Step 2 — SMART coaching</div>
          <div style={sectionHint}>Answer each one in simple words. These answers become your Rock&apos;s backbone.</div>
        </div>

        <Button type="button" onClick={onBuildFinalStatement}>
          Build Final Statement
        </Button>
      </div>

      <label style={label}>
        <div style={labelText}>Specific — What exactly will be different when this is done?</div>
        <textarea
          style={textarea}
          value={safeStr(rock?.smart?.specific)}
          onChange={(e) => onUpdateField("smart.specific", e.target.value, { autosave: true })}
          placeholder="What will be true when this Rock is complete?"
        />
      </label>

      <label style={label}>
        <div style={labelText}>Measurable — How will you prove it is complete?</div>
        <textarea
          style={textarea}
          value={safeStr(rock?.smart?.measurable)}
          onChange={(e) => onUpdateField("smart.measurable", e.target.value, { autosave: true })}
          placeholder="Numbers, counts, percentages, deadlines."
        />
      </label>

      <label style={label}>
        <div style={labelText}>Achievable — Why is this realistic this quarter?</div>
        <textarea
          style={textarea}
          value={safeStr(rock?.smart?.achievable)}
          onChange={(e) => onUpdateField("smart.achievable", e.target.value, { autosave: true })}
          placeholder="Resources, capacity, scope boundaries."
        />
      </label>

      <label style={label}>
        <div style={labelText}>Relevant — Why does this matter right now?</div>
        <textarea
          style={textarea}
          value={safeStr(rock?.smart?.relevant)}
          onChange={(e) => onUpdateField("smart.relevant", e.target.value, { autosave: true })}
          placeholder="What does it support? What problem does it solve?"
        />
      </label>

      <label style={label}>
        <div style={labelText}>Time-bound — What is the due date?</div>
        <input
          style={input}
          value={safeStr(rock?.smart?.timebound)}
          onChange={(e) => onUpdateField("smart.timebound", e.target.value, { autosave: true })}
          placeholder="e.g., Jan 31"
        />
      </label>
    </div>
  );
}
