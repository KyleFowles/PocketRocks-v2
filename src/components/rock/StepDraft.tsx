/* ============================================================
   FILE: src/components/rock/StepDraft.tsx

   SCOPE:
   Draft (Step 1) — Footer-only navigation
   - Content only: title + draft statement
   - No Save / Continue buttons here (footer owns navigation)
   - Optional AI help is available but visually quiet
   - Parent owns save + continue actions
   ============================================================ */

"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import type { Rock } from "@/types/rock";

function safeTrim(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

type BannerMsg = { kind: "error" | "ok"; text: string } | null;

type Props = {
  rock: Rock | null;
  onChange: (next: Rock) => void;

  saving?: boolean;
  saved?: boolean;
  banner?: BannerMsg;
  canInteract?: boolean;

  onImproveWithAI?: () => Promise<void> | void;
};

export default function StepDraft({
  rock,
  onChange,
  saving = false,
  saved = false,
  banner = null,
  canInteract = true,
  onImproveWithAI,
}: Props) {
  const [aiOpen, setAiOpen] = useState(false);

  const hasContent = useMemo(() => {
    const t = safeTrim(rock?.title);
    const d = safeTrim(rock?.draft);
    return t.length > 0 || d.length > 0;
  }, [rock?.title, rock?.draft]);

  const disabled = !canInteract || saving;

  if (!rock) {
    return (
      <div style={card}>
        <div style={hdrRow}>
          <div style={hdrTitle}>Draft</div>
        </div>
        <div style={{ marginTop: 10, opacity: 0.75 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={hdrRow}>
        <div>
          <div style={hdrTitle}>Draft</div>
          <div style={hdrHelp}>Write it in plain words. You’ll make it SMART next.</div>
        </div>

        <div style={{ marginLeft: "auto" }}>
          {saved && <div style={savedChip}>Saved</div>}
        </div>
      </div>

      {banner && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            borderRadius: 12,
            border:
              banner.kind === "error"
                ? "1px solid rgba(255,80,80,0.35)"
                : "1px solid rgba(80,255,170,0.22)",
            background:
              banner.kind === "error" ? "rgba(255,80,80,0.10)" : "rgba(80,255,170,0.10)",
            fontSize: 14,
          }}
        >
          {banner.text}
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <label style={labelStyle}>Title</label>
        <input
          value={rock.title ?? ""}
          onChange={(e) => onChange({ ...rock, title: e.target.value })}
          placeholder="Enter a rock title"
          style={inputStyle}
          disabled={disabled}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Draft statement</label>
        <textarea
          value={rock.draft ?? ""}
          onChange={(e) => onChange({ ...rock, draft: e.target.value })}
          placeholder="Write the Rock in plain language…"
          style={{ ...inputStyle, height: 130, resize: "vertical", paddingTop: 12 }}
          disabled={disabled}
        />
      </div>

      {/* Optional AI help (quiet + collapsible) */}
      {onImproveWithAI && (
        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            disabled={disabled || !hasContent}
            style={{
              appearance: "none",
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: disabled || !hasContent ? "default" : "pointer",
              color: "rgba(255,255,255,0.78)",
              fontWeight: 850,
              textDecoration: "underline",
              opacity: disabled || !hasContent ? 0.45 : 0.9,
            }}
          >
            Improve with AI (optional)
          </button>

          {aiOpen && (
            <div style={aiBox}>
              <div style={{ fontWeight: 850 }}>Want help tightening this Rock?</div>
              <div style={{ opacity: 0.78, marginTop: 4, lineHeight: 1.35 }}>
                Get a clearer statement and a strong starting point for SMART, metrics, and milestones.
              </div>

              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={() => onImproveWithAI?.()} disabled={disabled || !hasContent}>
                  Improve with AI
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.10)",
  background:
    "radial-gradient(900px 360px at 20% 10%, rgba(0,136,255,0.12), transparent 60%), radial-gradient(840px 380px at 80% 30%, rgba(255,121,0,0.12), transparent 55%), rgba(10,14,22,0.70)",
  boxShadow: "0 18px 70px rgba(0,0,0,0.45)",
  padding: 18,
};

const hdrRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
};

const hdrTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  letterSpacing: -0.2,
};

const hdrHelp: React.CSSProperties = {
  marginTop: 6,
  opacity: 0.78,
  lineHeight: 1.4,
  fontSize: 14,
};

const savedChip: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  opacity: 0.9,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.25)",
  fontWeight: 850,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 750,
  marginBottom: 8,
  opacity: 0.9,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
  padding: "12px 14px",
  color: "rgba(255,255,255,0.92)",
  outline: "none",
  fontSize: 16,
};

const aiBox: React.CSSProperties = {
  marginTop: 10,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.22)",
  padding: 14,
};
