/* ============================================================
   FILE: src/components/RockBuilder.tsx

   SCOPE:
   Rock Builder (Steps 1–5) — FOOTER-ONLY NAVIGATION
   - Step components are content-only (no Save/Continue buttons inside steps)
   - Footer owns navigation: Back + ONE primary action
   - Safe create-on-first-action for OPTION A:
       * If doc does not exist yet, first primary action creates via createRockWithId()
       * After created, autosave uses updateRock()
   - No updateDoc calls before creation (prevents permission-denied / missing-doc issues)
   - "Saved" shown as calm status, not button clutter
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import StepDraft from "@/components/rock/StepDraft";
import { createRockWithId, updateRock } from "@/lib/rocks";

type Step = 1 | 2 | 3 | 4 | 5;

type Props = {
  uid: string;
  rockId: string;
  initialRock: any;
};

type BannerMsg = { kind: "error" | "ok"; text: string } | null;

function safeStr(v: any): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return "";
  try {
    return String(v);
  } catch {
    return "";
  }
}

function safeTrim(v: any): string {
  return typeof v === "string" ? v.trim() : "";
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
  const [banner, setBanner] = useState<BannerMsg>(null);

  const saveTimer = useRef<any>(null);
  const lastPatchRef = useRef<any>(null);
  const aliveRef = useRef(true);

  // Monotonic save sequencing prevents out-of-order overwrites
  const saveSeqRef = useRef(0);

  // Skip identical saves
  const lastPatchKeyRef = useRef<string>("");

  // Track whether the Firestore doc exists yet (OPTION A)
  const createdRef = useRef<boolean>(false);

  // ✅ Once user navigates steps, do not let initialRock.step overwrite UI step
  const userNavigatedStepRef = useRef(false);

  // Optional AI state (kept minimal; StepDraft exposes only a click)
  const [aiLoading, setAiLoading] = useState(false);

  // Alive guard
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Determine if doc is already created based on incoming data
  useEffect(() => {
    // If we have an initialRock with matching id and userId, assume it exists.
    const hasDoc = !!initialRock && !!safeTrim(initialRock?.userId) && !!safeTrim(initialRock?.id || rockId);
    createdRef.current = hasDoc;
  }, [initialRock, rockId]);

  // Reset user navigation flag when switching to a different rock
  useEffect(() => {
    userNavigatedStepRef.current = false;
  }, [rockId]);

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

    // ✅ Only apply initialRock.step until the user starts navigating
    if (!userNavigatedStepRef.current && initialRock && initialRock.step !== undefined) {
      setStep(clampStep(initialRock.step));
    }
  }, [rockId, uid, initialRock]);

  const title = useMemo(() => safeStr(rock?.title) || "Rock", [rock?.title]);

  const hasContent = useMemo(() => {
    const t = safeTrim(rock?.title);
    const d = safeTrim(rock?.draft);
    return t.length > 0 || d.length > 0;
  }, [rock?.title, rock?.draft]);

  // -----------------------------
  // Creation + saving
  // -----------------------------

  async function ensureCreated(): Promise<boolean> {
    if (createdRef.current) return true;

    if (!uid || !rockId) {
      setSaveState("failed");
      setSaveError("Missing user or rock id.");
      setBanner({ kind: "error", text: "Missing user or rock id." });
      return false;
    }

    try {
      setSaveError(null);
      setBanner(null);
      setSaveState("saving");

      const payload = stripUndefinedDeep({
        ...rock,
        id: rockId,
        userId: uid,
        step,
      });

      await createRockWithId(uid, rockId, payload);

      if (!aliveRef.current) return false;

      createdRef.current = true;
      setSaveState("saved");
      setBanner({ kind: "ok", text: "Saved." });
      return true;
    } catch (e: any) {
      devError("[RockBuilder] createRockWithId failed:", e);
      if (!aliveRef.current) return false;

      setSaveState("failed");
      setSaveError(e?.message || "Save failed.");
      setBanner({ kind: "error", text: e?.message || "Save failed." });
      return false;
    }
  }

  function scheduleSave(patch: any) {
    // No autosave until created (prevents updateDoc on missing doc)
    if (!createdRef.current) return;

    const cleaned = stripUndefinedDeep(patch || {});
    const patchKey = stableStringify(cleaned);

    if (!cleaned || (typeof cleaned === "object" && Object.keys(cleaned).length === 0)) return;
    if (patchKey && patchKey === lastPatchKeyRef.current) return;

    lastPatchKeyRef.current = patchKey;
    lastPatchRef.current = cleaned;

    if (aliveRef.current) {
      setSaveError(null);
      setBanner(null);
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

  function setMany(patch: any) {
    setRock((prev: any) => {
      const next = { ...(prev || {}), ...(patch || {}) };
      scheduleSave(patch);
      return next;
    });
  }

  // Footer step navigation (pills still allowed, but footer is the only CTA zone)
  function goToStep(target: Step) {
    userNavigatedStepRef.current = true;
    setStep(() => {
      // Persist step only if created
      scheduleSave({ step: target });
      return target;
    });
  }

  function prevStep() {
    userNavigatedStepRef.current = true;
    setStep((s) => {
      const ps = s > 1 ? ((s - 1) as Step) : s;
      scheduleSave({ step: ps });
      return ps;
    });
  }

  async function primaryAction() {
    // One primary action per step
    if (step === 1) {
      // Create if needed, then advance
      const ok = await ensureCreated();
      if (!ok) return;
      goToStep(2);
      return;
    }

    if (step === 2) {
      // Build final statement and go to Review
      const s = safeStr(rock?.smart?.specific).trim();
      const m = safeStr(rock?.smart?.measurable).trim();
      const t = safeStr(rock?.smart?.timebound).trim();

      const base = s || safeStr(rock?.draft).trim() || safeStr(rock?.title).trim() || "Rock";
      const metric = m ? ` (${m})` : "";
      const due = t ? ` — Due ${t}` : "";

      const final = `${base}${metric}${due}`.trim();

      setMany({ finalStatement: final });
      goToStep(5);
      return;
    }

    if (step === 3) {
      goToStep(4);
      return;
    }

    if (step === 4) {
      goToStep(5);
      return;
    }

    if (step === 5) {
      // "Done" just ensures created + saves any last patch.
      const ok = await ensureCreated();
      if (!ok) return;

      // No routing here (keep it calm). You can wire a "Back to dashboard" later if desired.
      setBanner({ kind: "ok", text: "All set." });
      return;
    }
  }

  async function saveNow() {
    await ensureCreated();
  }

  async function runAiAssist() {
    const draft = safeStr(rock?.draft).trim();
    if (!draft) return;

    setAiLoading(true);
    setBanner(null);

    try {
      const res = await fetch("/api/rock-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft }),
      });

      if (!res.ok) throw new Error(`AI request failed (${res.status})`);

      const data = await res.json();
      const first = Array.isArray(data?.suggestions) ? data.suggestions?.[0] : null;
      const suggestion = safeStr(first?.text).trim();

      if (suggestion) {
        // Put it where Step 5 can show it
        setMany({ suggestedImprovement: suggestion });
        goToStep(5);
        setBanner({ kind: "ok", text: "AI suggestion added to Review." });
      } else {
        setBanner({ kind: "error", text: "No AI suggestions returned." });
      }
    } catch (e: any) {
      devError("[RockBuilder] /api/rock-suggest failed:", e);
      setBanner({ kind: "error", text: "AI suggestions are temporarily unavailable." });
    } finally {
      setAiLoading(false);
    }
  }

  const primaryLabel = useMemo(() => {
    if (step === 1) return createdRef.current ? "Continue → SMART" : "Save & Continue → SMART";
    if (step === 2) return "Build Final Statement";
    if (step === 3) return "Continue → Milestones";
    if (step === 4) return "Continue → Review";
    return "Done";
  }, [step]);

  // -----------------------------
  // UI
  // -----------------------------

  return (
    <div style={page}>
      <div style={topBar}>
        <div>
          <div style={brandRow}>
            <span style={brandOrange}>Pocket</span>
            <span style={brandWhite}>Rocks</span>
          </div>
          <div style={crumb}>ROCK · {stepName(step)}</div>
        </div>

        {/* Calm status (not a big “button-like” pill) */}
        <div style={statusWrap}>
          {saveState === "saving" && <div style={statusText}>Saving…</div>}
          {saveState === "saved" && <div style={{ ...statusText, opacity: 0.8 }}>Saved</div>}
          {saveState === "failed" && <div style={{ ...statusText, ...statusFail }}>Save failed</div>}
        </div>
      </div>

      <div style={card}>
        <div style={cardHdr}>
          <div>
            <div style={eyebrow}>{stepName(step)}</div>
            <div style={h1}>{title}</div>
            <div style={subMuted}>Build clear Rocks. Track them weekly.</div>
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
              5. Review
            </StepPill>
          </div>
        </div>

        {banner && (
          <div
            style={{
              margin: "0 18px 10px",
              padding: 14,
              borderRadius: 14,
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

        {saveError && (
          <div style={alert}>
            <div style={alertTitle}>Heads up</div>
            <div style={alertBody}>{saveError}</div>
          </div>
        )}

        {/* ======================================================
            STEP 1 — DRAFT (content-only)
           ====================================================== */}
        {step === 1 && (
          <div style={section}>
            <StepDraft
              rock={rock}
              onChange={(next) => setMany(next)}
              saving={saveState === "saving"}
              saved={saveState === "saved"}
              banner={null}
              canInteract={!aiLoading}
              onImproveWithAI={aiLoading ? undefined : runAiAssist}
            />
          </div>
        )}

        {/* ======================================================
            STEP 2 — SMART
           ====================================================== */}
        {step === 2 && (
          <div style={section}>
            <div style={sectionTitle}>SMART coaching</div>
            <div style={sectionHint}>Answer each one in simple words. These become your Rock’s backbone.</div>

            <label style={label}>
              <div style={labelText}>Specific — What exactly will be different when this is done?</div>
              <textarea
                style={textarea}
                value={safeStr(rock?.smart?.specific)}
                onChange={(e) => setMany({ smart: { ...(rock?.smart || {}), specific: e.target.value } })}
                placeholder="What will be true when this Rock is complete?"
              />
            </label>

            <label style={label}>
              <div style={labelText}>Measurable — How will you prove it is complete?</div>
              <textarea
                style={textarea}
                value={safeStr(rock?.smart?.measurable)}
                onChange={(e) => setMany({ smart: { ...(rock?.smart || {}), measurable: e.target.value } })}
                placeholder="Numbers, counts, percentages, deadlines."
              />
            </label>

            <label style={label}>
              <div style={labelText}>Achievable — Why is this realistic this quarter?</div>
              <textarea
                style={textarea}
                value={safeStr(rock?.smart?.achievable)}
                onChange={(e) => setMany({ smart: { ...(rock?.smart || {}), achievable: e.target.value } })}
                placeholder="Resources, capacity, scope boundaries."
              />
            </label>

            <label style={label}>
              <div style={labelText}>Relevant — Why does this matter right now?</div>
              <textarea
                style={textarea}
                value={safeStr(rock?.smart?.relevant)}
                onChange={(e) => setMany({ smart: { ...(rock?.smart || {}), relevant: e.target.value } })}
                placeholder="What does it support? What problem does it solve?"
              />
            </label>

            <label style={label}>
              <div style={labelText}>Time-bound — What is the due date?</div>
              <input
                style={input}
                value={safeStr(rock?.smart?.timebound)}
                onChange={(e) => setMany({ smart: { ...(rock?.smart || {}), timebound: e.target.value } })}
                placeholder="e.g., Jan 31"
              />
            </label>
          </div>
        )}

        {/* ======================================================
            STEP 3 — METRICS
           ====================================================== */}
        {step === 3 && (
          <div style={section}>
            <div style={sectionTitle}>Metrics</div>
            <div style={sectionHint}>Add 1–3 metrics you will track weekly.</div>

            <textarea
              style={textarea}
              value={safeStr(rock?.metricsText)}
              onChange={(e) => setMany({ metricsText: e.target.value })}
              placeholder="Example: Weekly customer response time (minutes)…"
            />
          </div>
        )}

        {/* ======================================================
            STEP 4 — MILESTONES
           ====================================================== */}
        {step === 4 && (
          <div style={section}>
            <div style={sectionTitle}>Milestones</div>
            <div style={sectionHint}>List key milestones (simple is fine).</div>

            <textarea
              style={textarea}
              value={safeStr(rock?.milestonesText)}
              onChange={(e) => setMany({ milestonesText: e.target.value })}
              placeholder={"Example:\n- Week 1: Define process\n- Week 3: Pilot\n- Week 6: Rollout"}
            />
          </div>
        )}

        {/* ======================================================
            STEP 5 — REVIEW
           ====================================================== */}
        {step === 5 && (
          <div style={section}>
            <div style={sectionTitle}>Review</div>
            <div style={sectionHint}>Make it clear. Don’t overthink it.</div>

            <label style={label}>
              <div style={labelText}>Final Rock statement</div>
              <textarea
                style={textarea}
                value={safeStr(rock?.finalStatement)}
                onChange={(e) => setMany({ finalStatement: e.target.value })}
                placeholder="This is what you’ll share with your leadership team."
              />
            </label>

            <label style={label}>
              <div style={labelText}>AI suggestion (optional)</div>
              <textarea
                style={textarea}
                value={safeStr(rock?.suggestedImprovement)}
                onChange={(e) => setMany({ suggestedImprovement: e.target.value })}
                placeholder="If you used AI, it will appear here. Edit freely."
              />
            </label>
          </div>
        )}

        {/* ======================================================
            FOOTER — THE ONLY NAVIGATION AREA
           ====================================================== */}
        <div style={footer}>
          <div style={footerLeft}>
            <div style={{ opacity: 0.7 }}>Step {step} of 5</div>

            {/* Quiet "save now" (only visible if doc not created yet or if user wants reassurance) */}
            <button
              type="button"
              onClick={saveNow}
              disabled={saveState === "saving" || !hasContent}
              style={{
                marginLeft: 12,
                appearance: "none",
                border: "none",
                background: "transparent",
                color: "rgba(255,255,255,0.78)",
                fontWeight: 850,
                cursor: saveState === "saving" || !hasContent ? "default" : "pointer",
                opacity: saveState === "saving" || !hasContent ? 0.45 : 0.9,
                textDecoration: "underline",
              }}
            >
              Save now
            </button>
          </div>

          <div style={footerRight}>
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              style={{
                appearance: "none",
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.85)",
                borderRadius: 14,
                padding: "10px 14px",
                fontWeight: 850,
                cursor: step === 1 ? "default" : "pointer",
                opacity: step === 1 ? 0.45 : 1,
              }}
            >
              Back
            </button>

            <Button type="button" onClick={primaryAction} disabled={step === 1 && !hasContent}>
              {primaryLabel}
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
      return "REVIEW";
  }
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

const statusWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 6,
};

const statusText: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 850,
  opacity: 0.9,
};

const statusFail: React.CSSProperties = {
  color: "rgba(255,140,140,0.95)",
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
  fontWeight: 850,
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
  fontWeight: 850,
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
  opacity: 0.75,
  display: "flex",
  alignItems: "center",
  gap: 0,
};

const footerRight: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
};
