/* ============================================================
   FILE: src/components/RockBuilder.tsx

   PATCH:
   Persist step when clicking step pills
   - StepPill clicks now call goToStep(n)
   - goToStep() updates local step + schedules save { step: n }
   - Keeps UI/styling unchanged
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { updateRock } from "@/lib/rocks";
import { Button } from "@/components/Button";

type Step = 1 | 2 | 3 | 4 | 5;

type Props = {
  uid: string;
  rockId: string;
  initialRock: any;
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

function clampStep(v: any): Step {
  const n = typeof v === "number" ? v : Number(v);
  if (n === 2) return 2;
  if (n === 3) return 3;
  if (n === 4) return 4;
  if (n === 5) return 5;
  return 1;
}

function stripUndefinedDeep(input: any): any {
  if (input === undefined) return undefined;
  if (Array.isArray(input)) return input.map(stripUndefinedDeep).filter((x) => x !== undefined);
  if (input && typeof input === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(input)) {
      const cleaned = stripUndefinedDeep(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  return input;
}

function devError(...args: any[]) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
}

function stableStringify(obj: any) {
  try {
    return JSON.stringify(obj, Object.keys(obj || {}).sort());
  } catch {
    return "";
  }
}

export default function RockBuilder({ uid, rockId, initialRock }: Props) {
  const [step, setStep] = useState<Step>(() => clampStep(initialRock?.step));

  const [rock, setRock] = useState<any>(() => ({
    ...(initialRock || {}),
    id: rockId,
    userId: uid,
    metrics: Array.isArray(initialRock?.metrics) ? initialRock.metrics : [],
    milestones: Array.isArray(initialRock?.milestones) ? initialRock.milestones : [],
  }));

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveTimer = useRef<any>(null);
  const lastPatchRef = useRef<any>(null);

  const aliveRef = useRef(true);

  // Monotonic save sequencing prevents out-of-order overwrites
  const saveSeqRef = useRef(0);

  // Skip identical saves
  const lastPatchKeyRef = useRef<string>("");

  // Alive guard (prevents setState after unmount)
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Keep local state in sync if parent reloads initialRock (rare, but safe).
  useEffect(() => {
    setRock((prev: any) => ({
      ...(prev || {}),
      ...(initialRock || {}),
      id: rockId,
      userId: uid,
      metrics: Array.isArray((initialRock || {})?.metrics) ? initialRock.metrics : prev?.metrics ?? [],
      milestones: Array.isArray((initialRock || {})?.milestones) ? initialRock.milestones : prev?.milestones ?? [],
    }));

    // Only update step if the loaded rock has a valid step
    if (initialRock && initialRock.step !== undefined) {
      setStep(clampStep(initialRock.step));
    }
  }, [rockId, uid, initialRock]);

  const title = useMemo(() => safeStr(rock?.title) || "Rock", [rock?.title]);
  const statement = useMemo(() => safeStr(rock?.statement), [rock?.statement]);

  function scheduleSave(patch: any) {
    const cleaned = stripUndefinedDeep(patch || {});
    const patchKey = stableStringify(cleaned);

    if (!cleaned || (typeof cleaned === "object" && Object.keys(cleaned).length === 0)) return;
    if (patchKey && patchKey === lastPatchKeyRef.current) return;

    lastPatchKeyRef.current = patchKey;
    lastPatchRef.current = cleaned;

    if (aliveRef.current) {
      setSaveError(null);
      setSaveState("saving");
    }

    if (saveTimer.current) clearTimeout(saveTimer.current);

    const mySeq = ++saveSeqRef.current;

    saveTimer.current = setTimeout(async () => {
      try {
        const toSave = lastPatchRef.current || {};
        await updateRock(uid, rockId, toSave);

        if (!aliveRef.current) return;
        if (mySeq !== saveSeqRef.current) return;

        setSaveState("saved");
      } catch (e: any) {
        devError("[RockBuilder] updateRock failed:", e);

        if (!aliveRef.current) return;
        if (mySeq !== saveSeqRef.current) return;

        setSaveState("failed");
        setSaveError(e?.message || "Save failed.");
      }
    }, 450);
  }

  function updateField(path: string, value: any) {
    setRock((prev: any) => {
      const next = { ...(prev || {}) };
      const parts = path.split(".");
      let cur: any = next;

      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i]!;
        cur[key] = cur[key] && typeof cur[key] === "object" ? { ...cur[key] } : {};
        cur = cur[key];
      }

      cur[parts[parts.length - 1]!] = value;

      const patch: any = {};
      let pcur: any = patch;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i]!;
        pcur[key] = pcur[key] && typeof pcur[key] === "object" ? pcur[key] : {};
        pcur = pcur[key];
      }
      pcur[parts[parts.length - 1]!] = value;

      scheduleSave(patch);

      return next;
    });
  }

  function setMany(patch: any) {
    setRock((prev: any) => {
      const next = { ...(prev || {}), ...(patch || {}) };
      scheduleSave(patch);
      return next;
    });
  }

  // ✅ NEW: Pill-friendly step setter that persists step
  function goToStep(target: Step) {
    setStep(() => {
      scheduleSave({ step: target });
      return target;
    });
  }

  function nextStep() {
    setStep((s) => {
      const ns = s < 5 ? ((s + 1) as Step) : s;
      scheduleSave({ step: ns });
      return ns;
    });
  }

  function prevStep() {
    setStep((s) => {
      const ps = s > 1 ? ((s - 1) as Step) : s;
      scheduleSave({ step: ps });
      return ps;
    });
  }

  function buildFinalFromSmart() {
    const s = safeStr(rock?.smart?.specific).trim();
    const m = safeStr(rock?.smart?.measurable).trim();
    const t = safeStr(rock?.smart?.timebound).trim();

    const base = s || statement || title;
    const metric = m ? ` (${m})` : "";
    const due = t ? ` — Due ${t}` : "";

    const final = `${base}${metric}${due}`.trim();
    setMany({ finalStatement: final });
  }

  return (
    <div style={page}>
      <div style={topBar}>
        <div>
          <div style={brandRow}>
            <span style={brandOrange}>Pocket</span>
            <span style={brandWhite}>Rocks</span>
          </div>
          <div style={crumb}>ROCK · {stepLabel(step)}</div>
        </div>

        <div style={savePillWrap}>
          {saveState === "saving" && <div style={pill}>Saving…</div>}
          {saveState === "saved" && <div style={{ ...pill, opacity: 0.85 }}>Saved</div>}
          {saveState === "failed" && <div style={{ ...pill, ...pillFail }}>Save failed</div>}
        </div>
      </div>

      <div style={card}>
        <div style={cardHdr}>
          <div>
            <div style={eyebrow}>{stepName(step)}</div>
            <div style={h1}>{title}</div>
            {statement ? <div style={sub}>{statement}</div> : <div style={subMuted}>Build clear Rocks. Track them weekly.</div>}
          </div>

          <div style={stepPills}>
            <StepPill active={step === 1} onClick={() => goToStep(1)}>
              1. Draft
            </StepPill>
            <StepPill active={step === 2} onClick={() => goToStep(2)}>
              2. SMART
            </StepPill>
            <StepPill active={step === 3} onClick={() => goToStep(3)}>
              3. Metrics
            </StepPill>
            <StepPill active={step === 4} onClick={() => goToStep(4)}>
              4. Milestones
            </StepPill>
            <StepPill active={step === 5} onClick={() => goToStep(5)}>
              5. Review + AI
            </StepPill>
          </div>
        </div>

        {saveError && (
          <div style={alert}>
            <div style={alertTitle}>Heads up</div>
            <div style={alertBody}>{saveError}</div>
          </div>
        )}

        {step === 1 && (
          <div style={section}>
            <div style={sectionTitle}>Step 1 — Draft</div>
            <div style={sectionHint}>Capture the goal in plain language. You can refine it later.</div>

            <label style={label}>
              <div style={labelText}>Title</div>
              <input
                style={input}
                value={safeStr(rock?.title)}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="New Rock"
              />
            </label>

            <label style={label}>
              <div style={labelText}>Draft Rock statement</div>
              <textarea
                style={textarea}
                value={safeStr(rock?.statement)}
                onChange={(e) => updateField("statement", e.target.value)}
                placeholder="Write a clear, outcome-based statement…"
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div style={section}>
            <div style={sectionTopRow}>
              <div>
                <div style={sectionTitle}>Step 2 — SMART coaching</div>
                <div style={sectionHint}>Answer each one in simple words. These answers become your Rock&apos;s backbone.</div>
              </div>

              <Button type="button" onClick={buildFinalFromSmart}>
                Build Final Statement
              </Button>
            </div>

            <label style={label}>
              <div style={labelText}>Specific — What exactly will be different when this is done?</div>
              <textarea
                style={textarea}
                value={safeStr(rock?.smart?.specific)}
                onChange={(e) => updateField("smart.specific", e.target.value)}
                placeholder="What will be true when this Rock is complete?"
              />
            </label>

            <label style={label}>
              <div style={labelText}>Measurable — How will you prove it is complete?</div>
              <textarea
                style={textarea}
                value={safeStr(rock?.smart?.measurable)}
                onChange={(e) => updateField("smart.measurable", e.target.value)}
                placeholder="Numbers, counts, percentages, deadlines."
              />
            </label>

            <label style={label}>
              <div style={labelText}>Achievable — Why is this realistic this quarter?</div>
              <textarea
                style={textarea}
                value={safeStr(rock?.smart?.achievable)}
                onChange={(e) => updateField("smart.achievable", e.target.value)}
                placeholder="Resources, capacity, scope boundaries."
              />
            </label>

            <label style={label}>
              <div style={labelText}>Relevant — Why does this matter right now?</div>
              <textarea
                style={textarea}
                value={safeStr(rock?.smart?.relevant)}
                onChange={(e) => updateField("smart.relevant", e.target.value)}
                placeholder="What does it support? What problem does it solve?"
              />
            </label>

            <label style={label}>
              <div style={labelText}>Time-bound — What is the due date?</div>
              <input
                style={input}
                value={safeStr(rock?.smart?.timebound)}
                onChange={(e) => updateField("smart.timebound", e.target.value)}
                placeholder="e.g., Jan 31"
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div style={section}>
            <div style={sectionTitle}>Step 3 — Metrics</div>
            <div style={sectionHint}>Add 1–3 metrics you will track weekly.</div>

            <textarea
              style={textarea}
              value={safeStr(rock?.metricsText)}
              onChange={(e) => updateField("metricsText", e.target.value)}
              placeholder="Example: Weekly customer response time (minutes)…"
            />
          </div>
        )}

        {step === 4 && (
          <div style={section}>
            <div style={sectionTitle}>Step 4 — Milestones</div>
            <div style={sectionHint}>List key milestones (simple is fine).</div>

            <textarea
              style={textarea}
              value={safeStr(rock?.milestonesText)}
              onChange={(e) => updateField("milestonesText", e.target.value)}
              placeholder={"Example:\n- Week 1: Define process\n- Week 3: Pilot\n- Week 6: Rollout"}
            />
          </div>
        )}

        {step === 5 && (
          <div style={section}>
            <div style={sectionTitle}>Step 5 — Review + AI</div>
            <div style={sectionHint}>Review your Rock. Save anytime.</div>

            <label style={label}>
              <div style={labelText}>Final Rock statement</div>
              <textarea
                style={textarea}
                value={safeStr(rock?.finalStatement)}
                onChange={(e) => updateField("finalStatement", e.target.value)}
                placeholder="This is what you’ll share with your leadership team."
              />
            </label>

            <label style={label}>
              <div style={labelText}>Suggested Improvement</div>
              <textarea
                style={textarea}
                value={safeStr(rock?.suggestedImprovement)}
                onChange={(e) => updateField("suggestedImprovement", e.target.value)}
                placeholder="Type a clearer, more specific version…"
              />
              <div style={tip}>Tip: Don’t perfect it. Just make it clearer.</div>
            </label>
          </div>
        )}

        <div style={footer}>
          <div style={footerLeft}>Step {step} of 5</div>

          <div style={footerRight}>
            <Button type="button" onClick={prevStep} disabled={step === 1}>
              Back
            </Button>

            <Button type="button" onClick={nextStep} disabled={step === 5}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   Small components
------------------------------ */

function StepPill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...pillBtn,
        ...(active ? pillBtnActive : {}),
      }}
    >
      {children}
    </button>
  );
}

function stepName(step: Step) {
  switch (step) {
    case 1:
      return "DRAFT";
    case 2:
      return "SMART";
    case 3:
      return "METRICS";
    case 4:
      return "MILESTONES";
    case 5:
      return "REVIEW + AI";
  }
}

function stepLabel(step: Step) {
  return stepName(step);
}

/* -----------------------------
   Styles
------------------------------ */

const page: React.CSSProperties = {
  minHeight: "100vh",
  padding: "22px",
  background:
    "radial-gradient(1000px 520px at 20% 20%, rgba(60,130,255,0.20), transparent 60%), radial-gradient(900px 480px at 70% 30%, rgba(255,120,0,0.12), transparent 60%), #050812",
  color: "rgba(255,255,255,0.92)",
};

const topBar: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
};

const brandRow: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 0,
  lineHeight: 1,
};

const brandOrange: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 900,
  color: "#FF7900",
  letterSpacing: -0.3,
};

const brandWhite: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 900,
  color: "rgba(255,255,255,0.92)",
  letterSpacing: -0.3,
};

const crumb: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  letterSpacing: 2.5,
  opacity: 0.55,
};

const savePillWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 6,
};

const pill: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 800,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
};

const pillFail: React.CSSProperties = {
  border: "1px solid rgba(255,80,80,0.35)",
  background: "rgba(255,80,80,0.12)",
};

const card: React.CSSProperties = {
  maxWidth: 1100,
  margin: "18px auto 0",
  borderRadius: 26,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.28)",
  overflow: "hidden",
  boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
};

const cardHdr: React.CSSProperties = {
  padding: "18px 18px 10px",
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const eyebrow: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: 3,
  opacity: 0.6,
  marginBottom: 4,
};

const h1: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 900,
  letterSpacing: -0.4,
};

const sub: React.CSSProperties = {
  marginTop: 6,
  opacity: 0.75,
};

const subMuted: React.CSSProperties = {
  marginTop: 6,
  opacity: 0.6,
};

const stepPills: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const pillBtn: React.CSSProperties = {
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 800,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.86)",
  cursor: "pointer",
};

const pillBtnActive: React.CSSProperties = {
  border: "1px solid rgba(255,121,0,0.55)",
  background: "rgba(255,121,0,0.10)",
  color: "rgba(255,255,255,0.95)",
};

const alert: React.CSSProperties = {
  margin: "0 18px 10px",
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(255,80,80,0.35)",
  background: "rgba(255,80,80,0.10)",
};

const alertTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  marginBottom: 6,
};

const alertBody: React.CSSProperties = {
  fontSize: 14,
  opacity: 0.9,
};

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

const tip: React.CSSProperties = {
  marginTop: 6,
  fontSize: 13,
  opacity: 0.6,
};

const footer: React.CSSProperties = {
  padding: "14px 18px",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const footerLeft: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.65,
};

const footerRight: React.CSSProperties = {
  display: "flex",
  gap: 10,
};
