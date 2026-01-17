/* ============================================================
   FILE: src/components/rock/StepReviewAi.tsx

   SCOPE:
   Review + AI (Step 5)
   - Shows "Your assembled Final Rock" vs "AI Suggested Improvement"
   - Fixes textarea scrolling inside the frame
   - Explicit "Apply AI version" (never silently overwrites)
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import type { Rock } from "@/types/rock";
import { assembleFinalRock } from "@/components/rockBuilder/finalAssembler";

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

  // Parent-provided AI action: should generate suggestion FROM the assembled final
  onImproveWithAI?: (assembledFinal: string) => Promise<string | null> | string | null;
};

export default function StepReviewAi({
  rock,
  onChange,
  saving = false,
  saved = false,
  banner = null,
  canInteract = true,
  onImproveWithAI,
}: Props) {
  const disabled = !canInteract || saving;

  const assembled = useMemo(() => assembleFinalRock(rock), [rock]);

  // Store AI suggestion in rock.aiSuggestion (or adapt to your schema)
  const aiText = safeTrim(
    // @ts-ignore
    rock?.aiSuggestion
  );

  // Always keep finalStatement populated (baseline)
  useEffect(() => {
    if (!rock) return;
    const current = safeTrim(
      // @ts-ignore
      rock.finalStatement
    );

    // Only auto-fill if empty — never fight the user once they start editing
    if (!current) {
      onChange({
        ...rock,
        // @ts-ignore
        finalStatement: assembled,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rock?.id, assembled]); // anchor on id so we don't loop on every onChange

  const finalValue = safeTrim(
    // @ts-ignore
    rock?.finalStatement
  );

  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function handleImprove() {
    if (!rock || !onImproveWithAI) return;
    setAiError(null);
    setAiBusy(true);
    try {
      const res = await onImproveWithAI(assembleFinalRock(rock));
      const text = safeTrim(res);
      if (!text) {
        setAiError("AI needs more information—here’s a SMART starter framework to help you out.");
        return;
      }
      onChange({
        ...rock,
        // @ts-ignore
        aiSuggestion: text,
      });
    } catch (e: any) {
      setAiError(e?.message || "AI request failed. Please try again.");
    } finally {
      setAiBusy(false);
    }
  }

  function applyAi() {
    if (!rock) return;
    if (!aiText) return;
    onChange({
      ...rock,
      // @ts-ignore
      finalStatement: aiText,
    });
  }

  if (!rock) {
    return (
      <div style={card}>
        <div style={hdrRow}>
          <div style={hdrTitle}>Review + AI</div>
        </div>
        <div style={{ marginTop: 10, opacity: 0.75 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={hdrRow}>
        <div>
          <div style={hdrTitle}>Review + AI</div>
          <div style={hdrHelp}>
            Review your Rock. We built a starting point from what you entered. Improve with AI if you want.
          </div>
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

      <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
        {/* Your assembled / editable */}
        <section style={panel}>
          <div style={panelHdr}>
            <div style={panelTitle}>Your assembled Final Rock</div>
            <div style={panelSub}>This is built from your Draft + SMART + Measurables + Milestones.</div>
          </div>

          <label style={labelStyle}>Final Rock statement</label>
          <textarea
            value={finalValue}
            onChange={(e) =>
              onChange({
                ...rock,
                // @ts-ignore
                finalStatement: e.target.value,
              })
            }
            placeholder="Your final statement will be assembled here…"
            disabled={disabled}
            style={{
              ...textareaStyle,
              // ✅ key: allow scrolling INSIDE the textarea
              overflowY: "auto",
            }}
          />
        </section>

        {/* AI suggestion / separate */}
        <section style={panelAi}>
          <div style={panelHdr}>
            <div style={panelTitle}>AI suggested improvement</div>
            <div style={panelSub}>Clearer, tighter wording — built from your assembled version.</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end" }}>
            <Button onClick={handleImprove} disabled={disabled || aiBusy || !onImproveWithAI}>
              {aiBusy ? "Improving…" : "Improve with AI"}
            </Button>

            <Button onClick={applyAi} disabled={disabled || !aiText}>
              Apply AI version
            </Button>
          </div>

          {aiError && (
            <div style={aiErrorBox}>
              {aiError}
              <div style={{ marginTop: 6, opacity: 0.8 }}>
                Tip: Add a bit more detail in SMART or Measurables, then try again.
              </div>
            </div>
          )}

          <div style={aiReadOnlyBox}>
            {aiText ? (
              <pre style={preStyle}>{aiText}</pre>
            ) : (
              <div style={{ opacity: 0.68 }}>
                AI suggestion will appear here after you click <b>Improve with AI</b>.
              </div>
            )}
          </div>

          <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
            Tip: You’ll always keep your version. AI never overwrites silently.
          </div>
        </section>
      </div>
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

const panel: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.20)",
  padding: 14,
};

const panelAi: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(0,136,255,0.25)",
  background: "rgba(0,136,255,0.06)",
  padding: 14,
};

const panelHdr: React.CSSProperties = {
  marginBottom: 10,
};

const panelTitle: React.CSSProperties = {
  fontWeight: 950,
  fontSize: 16,
};

const panelSub: React.CSSProperties = {
  marginTop: 4,
  opacity: 0.78,
  fontSize: 13,
  lineHeight: 1.35,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 750,
  marginBottom: 8,
  opacity: 0.9,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
  padding: "12px 14px",
  color: "rgba(255,255,255,0.92)",
  outline: "none",
  fontSize: 15,
  minHeight: 160,
  maxHeight: 260, // ✅ keeps it from expanding forever; scroll inside instead
  resize: "vertical",
};

const aiReadOnlyBox: React.CSSProperties = {
  marginTop: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.18)",
  padding: 12,
  minHeight: 160,
};

const preStyle: React.CSSProperties = {
  margin: 0,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontFamily: "inherit",
  lineHeight: 1.4,
  color: "rgba(255,255,255,0.92)",
};

const aiErrorBox: React.CSSProperties = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,80,80,0.35)",
  background: "rgba(255,80,80,0.10)",
  fontSize: 14,
};
