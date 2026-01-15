/* ============================================================
   FILE: src/components/rock/AISuggestionsPanel.tsx

   SCOPE:
   AI Suggestions UI helper
   - Make ALL fields safe for controlled components
   - No trimming in onChange (prevents “typing feels broken”)
   ============================================================ */

"use client";

import React from "react";
import { Button } from "@/components/Button";
import { safeStr } from "@/lib/input";

export default function AISuggestionsPanel(props: {
  value?: string | null;
  onChange: (v: string) => void;

  busy?: boolean;
  error?: string | null;

  onGenerate: () => Promise<void> | void;
  onApply?: () => Promise<void> | void;
}) {
  const v = safeStr(props.value);

  return (
    <div style={panel}>
      <div style={topRow}>
        <div>
          <div style={title}>AI Suggestions</div>
          <div style={sub}>Generate a few better options, then paste or apply one.</div>
        </div>

        <div style={btnRow}>
          <Button type="button" onClick={props.onGenerate} disabled={!!props.busy} style={btnPrimary}>
            {props.busy ? "Generating…" : "Generate"}
          </Button>

          {props.onApply ? (
            <Button type="button" onClick={props.onApply} disabled={!!props.busy} style={btnGhost}>
              Apply
            </Button>
          ) : null}
        </div>
      </div>

      {props.error ? <div style={err}>{props.error}</div> : null}

      <textarea
        value={v} // ✅ ALWAYS string
        onChange={(e) => props.onChange(e.target.value)} // ✅ NO trim here
        style={textarea}
        placeholder="Your improved statement will appear here…"
      />
    </div>
  );
}

const panel: React.CSSProperties = {
  borderRadius: 16,
  padding: 14,
  border: "1px solid rgba(90,150,255,0.20)",
  background: "rgba(90,150,255,0.06)",
};

const topRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 10,
};

const title: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
};

const sub: React.CSSProperties = {
  marginTop: 6,
  color: "rgba(255,255,255,0.55)",
  fontSize: 13,
};

const btnRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const btnBase: React.CSSProperties = {
  borderRadius: 14,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 800,
  border: "1px solid rgba(255,255,255,0.12)",
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(180deg, rgba(80,140,255,0.95), rgba(30,90,230,0.95))",
  color: "white",
  border: "1px solid rgba(90,150,255,0.55)",
};

const btnGhost: React.CSSProperties = {
  ...btnBase,
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.92)",
};

const err: React.CSSProperties = {
  marginBottom: 10,
  borderRadius: 14,
  padding: 12,
  border: "1px solid rgba(255,80,80,0.35)",
  background: "rgba(255,80,80,0.10)",
  color: "white",
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 120,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.25)",
  color: "rgba(255,255,255,0.92)",
  outline: "none",
  fontSize: 16,
  resize: "vertical",
  whiteSpace: "pre-wrap",
};
