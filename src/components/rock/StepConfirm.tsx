/* ============================================================
   FILE: src/components/rock/StepConfirm.tsx

   SCOPE:
   Step 5 — CONFIRM (clean, no visual collision)
   - No giant “second hero” banner
   - Calm summary card + tidy sections
   - Contextual Edit buttons inside each section
   - Export/Print is present but not loud
   - Print styles included

   TS FIX (one-and-done):
   - Strongly type metrics + milestones as string[]
   - Type map params (m: string, idx: number) to satisfy noImplicitAny
   ============================================================ */

"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/Button";

type AnyRock = any;
type Step = 1 | 2 | 3 | 4 | 5;

function safeStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function safeTrim(v: unknown): string {
  return safeStr(v).trim();
}
function toLines(v: unknown): string[] {
  const s = safeTrim(v);
  if (!s) return [];
  return s
    .split("\n")
    .map((x: string) => x.trim())
    .filter(Boolean);
}
function countLabel(n: number): string {
  if (n === 1) return "1 item";
  return `${n} items`;
}
function hasAnySmart(r: AnyRock): boolean {
  const s = safeTrim(r?.smart?.specific);
  const m = safeTrim(r?.smart?.measurable);
  const a = safeTrim(r?.smart?.achievable);
  const rel = safeTrim(r?.smart?.relevant);
  const t = safeTrim(r?.smart?.timebound);
  return !!(s || m || a || rel || t);
}
function pickFinalStatement(r: AnyRock): string {
  return (
    safeTrim(r?.finalStatement) ||
    safeTrim(r?.smart?.specific) ||
    safeTrim(r?.suggestedImprovement) ||
    safeTrim(r?.draft) ||
    safeTrim(r?.title) ||
    "Rock"
  );
}
function pickDue(r: AnyRock): string {
  return safeTrim(r?.dueDate) || safeTrim(r?.smart?.timebound);
}

export default function StepConfirm({
  rock,
  onJumpToStep,
}: {
  rock: AnyRock;
  onJumpToStep?: (step: Step) => void;
}) {
  const title = useMemo(() => safeTrim(rock?.title) || "Rock", [rock?.title]);
  const draft = useMemo(() => safeTrim(rock?.draft), [rock?.draft]);
  const finalStatement = useMemo(() => pickFinalStatement(rock), [rock]);
  const due = useMemo(() => pickDue(rock), [rock]);

  const showSmart = useMemo(() => hasAnySmart(rock), [rock]);

  const smart = useMemo(() => {
    return {
      specific: safeTrim(rock?.smart?.specific),
      measurable: safeTrim(rock?.smart?.measurable),
      achievable: safeTrim(rock?.smart?.achievable),
      relevant: safeTrim(rock?.smart?.relevant),
      timebound: safeTrim(rock?.smart?.timebound),
    };
  }, [rock?.smart]);

  const metrics = useMemo<string[]>(() => {
    const lines = toLines(rock?.metricsText);
    if (lines.length) return lines;

    const arr: any[] = Array.isArray(rock?.metrics) ? rock.metrics : [];
    const normalized: string[] = arr
      .map((m: any) => {
        if (typeof m === "string") return m.trim();
        if (m && typeof m === "object") {
          return safeTrim(m?.name) || safeTrim(m?.text) || safeTrim(m?.label);
        }
        return "";
      })
      .filter((x: string) => Boolean(x));

    return normalized;
  }, [rock?.metricsText, rock?.metrics]);

  const milestones = useMemo<string[]>(() => {
    const lines = toLines(rock?.milestonesText);
    if (lines.length) return lines;

    const arr: any[] = Array.isArray(rock?.milestones) ? rock.milestones : [];
    const normalized: string[] = arr
      .map((m: any) => {
        if (typeof m === "string") return m.trim();
        if (m && typeof m === "object") {
          return safeTrim(m?.title) || safeTrim(m?.text) || safeTrim(m?.label);
        }
        return "";
      })
      .filter((x: string) => Boolean(x));

    return normalized;
  }, [rock?.milestonesText, rock?.milestones]);

  const aiSuggestion = useMemo(
    () => safeTrim(rock?.suggestedImprovement),
    [rock?.suggestedImprovement]
  );

  function onExport() {
    if (typeof window === "undefined") return;
    window.print();
  }

  return (
    <div className="pr5-wrap">
      <style>{`
        .pr5-wrap{
          padding: 14px 18px 20px;
          display: grid;
          gap: 14px;
        }

        .pr5-summary{
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.22);
          box-shadow: 0 14px 50px rgba(0,0,0,0.28);
          overflow: hidden;
        }

        .pr5-summaryInner{
          padding: 16px;
          display: grid;
          gap: 10px;
        }

        .pr5-summaryTop{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .pr5-eyebrow{
          font-size: 12px;
          letter-spacing: 3px;
          opacity: 0.65;
          margin-bottom: 6px;
        }

        .pr5-final{
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -0.3px;
          line-height: 1.2;
          color: rgba(255,255,255,0.96);
          margin: 0;
          max-width: 900px;
        }

        .pr5-sub{
          font-size: 13px;
          opacity: 0.78;
          line-height: 1.45;
          margin-top: 2px;
          max-width: 900px;
        }

        .pr5-chips{
          display:flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 6px;
        }

        .pr5-chip{
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 900;
          opacity: 0.9;
          white-space: nowrap;
        }

        .pr5-chipAccent{
          border-color: rgba(255,121,0,0.35);
          background: rgba(255,121,0,0.10);
        }

        .pr5-grid{
          display:grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 14px;
        }

        @media (max-width: 860px){
          .pr5-grid{ grid-template-columns: 1fr; }
        }

        .pr5-card{
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.22);
          box-shadow: 0 14px 50px rgba(0,0,0,0.28);
          overflow:hidden;
        }

        .pr5-cardInner{
          padding: 16px;
          display:grid;
          gap: 12px;
        }

        .pr5-cardHdr{
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .pr5-cardTitle{
          margin:0;
          font-size: 16px;
          font-weight: 950;
          letter-spacing: -0.2px;
        }

        .pr5-hdrRight{
          display:flex;
          gap: 8px;
          align-items:center;
          flex-wrap: wrap;
        }

        .pr5-badge{
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.05);
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 900;
          opacity: 0.9;
          white-space: nowrap;
        }

        .pr5-edit{
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.05);
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          color: rgba(255,255,255,0.92);
          opacity: 0.9;
        }
        .pr5-edit:hover{
          opacity: 1;
          border-color: rgba(255,121,0,0.35);
        }

        .pr5-divider{
          height: 1px;
          background: rgba(255,255,255,0.08);
        }

        .pr5-table{
          width:100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .pr5-k{
          width: 140px;
          padding: 10px 10px 10px 0;
          opacity: 0.75;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          font-size: 11px;
          font-weight: 900;
          vertical-align: top;
          white-space: nowrap;
        }

        .pr5-v{
          padding: 10px 0;
          opacity: 0.92;
          line-height: 1.45;
        }

        .pr5-list{
          margin:0;
          padding-left: 18px;
          display:grid;
          gap: 8px;
        }

        .pr5-empty{
          border-radius: 16px;
          border: 1px dashed rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.03);
          padding: 12px;
          font-size: 13px;
          opacity: 0.72;
          line-height: 1.4;
        }

        .pr5-ai{
          border-radius: 18px;
          border: 1px solid rgba(255,121,0,0.20);
          background: rgba(255,121,0,0.06);
          padding: 14px;
          font-size: 14px;
          line-height: 1.5;
          opacity: 0.92;
        }

        .pr5-note{
          font-size: 12px;
          opacity: 0.62;
          line-height: 1.45;
        }

        @media print{
          button, .pr5-edit { display: none !important; }
          .pr5-wrap{ padding: 0 !important; }
          .pr5-summary, .pr5-card{ box-shadow: none !important; }

          .pr5-summary, .pr5-card{
            border: 1px solid rgba(0,0,0,0.18) !important;
            background: #fff !important;
            color: #111 !important;
          }
          .pr5-divider{ background: rgba(0,0,0,0.12) !important; }
          .pr5-chip, .pr5-badge{
            border: 1px solid rgba(0,0,0,0.18) !important;
            background: #fff !important;
            color: #111 !important;
          }
          .pr5-final, .pr5-sub{ color:#111 !important; }
          .pr5-empty{
            border: 1px dashed rgba(0,0,0,0.25) !important;
            background: #fff !important;
            color:#111 !important;
          }
          .pr5-ai{
            border: 1px solid rgba(0,0,0,0.25) !important;
            background:#fff !important;
            color:#111 !important;
          }
        }
      `}</style>

      {/* SUMMARY (quiet, single focus) */}
      <div className="pr5-summary">
        <div className="pr5-summaryInner">
          <div className="pr5-summaryTop">
            <div style={{ minWidth: 280 }}>
              <div className="pr5-eyebrow">CONFIRM</div>
              <h3 className="pr5-final">{finalStatement}</h3>
              <div className="pr5-sub">
                Quick review. If anything feels off, click <b>Edit</b> inside that section.
              </div>

              <div className="pr5-chips">
                <div className="pr5-chip">{title}</div>
                {due ? <div className="pr5-chip pr5-chipAccent">Due {due}</div> : null}
                {showSmart ? <div className="pr5-chip">SMART</div> : null}
                {metrics.length ? <div className="pr5-chip">{countLabel(metrics.length)} metrics</div> : null}
                {milestones.length ? (
                  <div className="pr5-chip">{countLabel(milestones.length)} milestones</div>
                ) : null}
              </div>
            </div>

            <div>
              <Button type="button" onClick={onExport}>
                Export / Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="pr5-grid">
        {/* LEFT: SMART + AI */}
        <div className="pr5-card">
          <div className="pr5-cardInner">
            <div className="pr5-cardHdr">
              <h4 className="pr5-cardTitle">SMART</h4>
              <div className="pr5-hdrRight">
                <div className="pr5-badge">{showSmart ? "Entered" : "Missing"}</div>
                <button type="button" className="pr5-edit" onClick={() => onJumpToStep?.(2)}>
                  Edit
                </button>
              </div>
            </div>

            <div className="pr5-divider" />

            {showSmart ? (
              <table className="pr5-table">
                <tbody>
                  {[
                    ["Specific", smart.specific],
                    ["Measurable", smart.measurable],
                    ["Achievable", smart.achievable],
                    ["Relevant", smart.relevant],
                    ["Time-bound", smart.timebound],
                  ].map(([k, v]) => (
                    <tr key={String(k)} style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      <td className="pr5-k">{k}</td>
                      <td className="pr5-v">{v || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="pr5-empty">No SMART fields yet. Click Edit and add one sentence per line.</div>
            )}

            {aiSuggestion ? (
              <>
                <div className="pr5-divider" />
                <div>
                  <div className="pr5-eyebrow" style={{ marginBottom: 8 }}>
                    AI SUGGESTION
                  </div>
                  <div className="pr5-ai">{aiSuggestion}</div>
                </div>
              </>
            ) : null}

            <div className="pr5-note">
              If the final statement feels messy, fix it in <b>Specific</b> and <b>Measurable</b>.
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "grid", gap: 14 }}>
          <div className="pr5-card">
            <div className="pr5-cardInner">
              <div className="pr5-cardHdr">
                <h4 className="pr5-cardTitle">Metrics</h4>
                <div className="pr5-hdrRight">
                  <div className="pr5-badge">{metrics.length ? countLabel(metrics.length) : "None"}</div>
                  <button type="button" className="pr5-edit" onClick={() => onJumpToStep?.(3)}>
                    Edit
                  </button>
                </div>
              </div>

              <div className="pr5-divider" />

              {metrics.length ? (
                <ul className="pr5-list">
                  {metrics.map((m: string, idx: number) => (
                    <li key={`${String(m)}-${idx}`} style={{ lineHeight: 1.4, opacity: 0.92 }}>
                      {m}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="pr5-empty">Add 1–3 simple metrics that prove you’re winning.</div>
              )}
            </div>
          </div>

          <div className="pr5-card">
            <div className="pr5-cardInner">
              <div className="pr5-cardHdr">
                <h4 className="pr5-cardTitle">Milestones</h4>
                <div className="pr5-hdrRight">
                  <div className="pr5-badge">
                    {milestones.length ? countLabel(milestones.length) : "None"}
                  </div>
                  <button type="button" className="pr5-edit" onClick={() => onJumpToStep?.(4)}>
                    Edit
                  </button>
                </div>
              </div>

              <div className="pr5-divider" />

              {milestones.length ? (
                <ul className="pr5-list">
                  {milestones.map((m: string, idx: number) => (
                    <li key={`${String(m)}-${idx}`} style={{ lineHeight: 1.4, opacity: 0.92 }}>
                      {m}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="pr5-empty">Add 3–5 milestones so this Rock feels real and trackable.</div>
              )}
            </div>
          </div>

          <div className="pr5-card">
            <div className="pr5-cardInner">
              <div className="pr5-cardHdr">
                <h4 className="pr5-cardTitle">Draft</h4>
                <div className="pr5-hdrRight">
                  <div className="pr5-badge">{draft ? "Entered" : "Empty"}</div>
                  <button type="button" className="pr5-edit" onClick={() => onJumpToStep?.(1)}>
                    Edit
                  </button>
                </div>
              </div>

              <div className="pr5-divider" />

              {draft ? (
                <div style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.9 }}>{draft}</div>
              ) : (
                <div className="pr5-empty">
                  Draft is optional. If SMART is strong, you can ignore this.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
