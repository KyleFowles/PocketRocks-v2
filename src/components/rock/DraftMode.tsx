/* ============================================================
   FILE: src/components/rock/DraftMode.tsx

   SCOPE:
   Draft screen UI (Step 1 of 5)
   - Title input + Draft textarea
   - Bottom sticky bar with Save now + Continue
   - CRITICAL FIX: Buttons are type="button" (no form submit)
   ============================================================ */

"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/Button";

type Props = {
  title: string;
  draft: string;
  saving?: boolean;
  lastSavedAt?: number | null;

  onChangeTitle: (v: string) => void;
  onChangeDraft: (v: string) => void;

  onSaveNow: () => Promise<void> | void;
  onContinue: () => Promise<void> | void;
};

function fmtSaved(lastSavedAt?: number | null) {
  if (!lastSavedAt) return "Not saved yet";
  return "Saved";
}

export default function DraftMode(props: Props) {
  const canContinue = useMemo(() => {
    const t = (props.title ?? "").trim();
    const d = (props.draft ?? "").trim();
    return t.length > 0 || d.length > 0;
  }, [props.title, props.draft]);

  // IMPORTANT:
  // Wrap everything in a plain <div>, NOT a <form>.
  // If you ever put this into a <form>, the Continue button must stay type="button".
  return (
    <div style={shell}>
      <div style={panel}>
        <div style={eyebrow}>DRAFT</div>
        <h1 style={h1}>Start your Rock</h1>
        <p style={sub}>Capture the goal in plain language. You can refine it later.</p>

        <div style={card}>
          <label style={label}>
            <div style={labelText}>Title</div>
            <input
              value={props.title ?? ""}
              onChange={(e) => props.onChangeTitle(e.target.value)}
              placeholder="New Rock"
              style={input}
              autoComplete="off"
            />
          </label>

          <label style={{ ...label, marginTop: 14 }}>
            <div style={labelText}>Draft Rock statement</div>
            <textarea
              value={props.draft ?? ""}
              onChange={(e) => props.onChangeDraft(e.target.value)}
              placeholder="Write a clear, outcome-based statement..."
              style={textarea}
            />
          </label>

          <div style={metaRow}>
            <div style={tip}>Tip: Keep it measurable and time-bound.</div>
            <div style={saved}>{fmtSaved(props.lastSavedAt)}</div>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div style={stickyWrap}>
        <div style={stickyBar}>
          <div style={leftText}>Draft · Step 1 of 5</div>

          <div style={btnRow}>
            <Button
              type="button"
              onClick={(e: any) => {
                // extra safety if Button component passes event
                try {
                  e?.preventDefault?.();
                  e?.stopPropagation?.();
                } catch {}
                props.onSaveNow();
              }}
              disabled={!!props.saving}
              style={btnGhost}
            >
              Save now
            </Button>

            <Button
              type="button"
              onClick={(e: any) => {
                try {
                  e?.preventDefault?.();
                  e?.stopPropagation?.();
                } catch {}
                props.onContinue();
              }}
              disabled={!!props.saving || !canContinue}
              style={canContinue ? btnPrimary : btnDisabled}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   Styles (inline, stable)
------------------------------ */

const shell: React.CSSProperties = {
  paddingBottom: 110, // space for sticky bar
};

const panel: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  padding: "26px 22px 22px",
};

const eyebrow: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: 3,
  color: "rgba(255,255,255,0.55)",
  marginBottom: 10,
};

const h1: React.CSSProperties = {
  fontSize: 34,
  fontWeight: 900,
  margin: 0,
  color: "rgba(255,255,255,0.95)",
};

const sub: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 18,
  color: "rgba(255,255,255,0.65)",
  fontSize: 16,
};

const card: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.28)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
  padding: 18,
};

const label: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const labelText: React.CSSProperties = {
  color: "rgba(255,255,255,0.75)",
  fontSize: 14,
  fontWeight: 700,
};

const input: React.CSSProperties = {
  width: "100%",
  height: 54,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.92)",
  outline: "none",
  fontSize: 16,
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 140,
  padding: "14px 14px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.92)",
  outline: "none",
  fontSize: 16,
  resize: "vertical",
};

const metaRow: React.CSSProperties = {
  marginTop: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const tip: React.CSSProperties = {
  color: "rgba(255,255,255,0.55)",
  fontSize: 14,
};

const saved: React.CSSProperties = {
  color: "rgba(255,255,255,0.55)",
  fontSize: 14,
};

const stickyWrap: React.CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  padding: "14px 18px 18px",
  background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))",
  zIndex: 50,
};

const stickyBar: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.40)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
  padding: "14px 14px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
};

const leftText: React.CSSProperties = {
  color: "rgba(255,255,255,0.60)",
  fontSize: 14,
  whiteSpace: "nowrap",
};

const btnRow: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const btnBase: React.CSSProperties = {
  borderRadius: 14,
  padding: "12px 16px",
  fontSize: 16,
  fontWeight: 800,
  border: "1px solid rgba(255,255,255,0.12)",
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  ...btnBase,
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.92)",
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(180deg, rgba(80,140,255,0.95), rgba(30,90,230,0.95))",
  color: "white",
  border: "1px solid rgba(90,150,255,0.55)",
};

const btnDisabled: React.CSSProperties = {
  ...btnBase,
  background: "rgba(255,255,255,0.10)",
  color: "rgba(255,255,255,0.45)",
  cursor: "not-allowed",
};
