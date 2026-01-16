/* ============================================================
   FILE: src/components/RockBuilder.tsx

   SCOPE:
   Rock Builder (Steps 1–5) — FOOTER-ONLY NAV + STABILITY
   - Step 1 (Draft) is LOCAL ONLY while typing (no autosave per keystroke)
     * Saves only on: Continue to SMART, Improve with AI
     * (Save Draft button removed from Step 1 footer — optional behavior removed)
   - Steps 2–5 can autosave (debounced) to reduce friction
   - AI on Step 5 (Review + AI):
     * If no AI suggestion yet, primary footer button becomes "Improve with AI"
     * Clicking it calls /api/rock-suggest, saves suggestedImprovement, stays on Step 5
     * Once suggestion exists, primary button becomes "Done" and is disabled
   - New Rock doc creation:
     * If doc doesn't exist yet, create once via createRockWithId()
     * Then patch via updateRock()
   - Prevent setState after unmount
   - Never sends undefined to Firestore
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/Button";
import StepDraft from "@/components/rock/StepDraft";
import StepSmart from "@/components/rock/StepSmart";
import StepMetrics from "@/components/rock/StepMetrics";
import StepMilestones from "@/components/rock/StepMilestones";
import { createRockWithId, updateRock } from "@/lib/rocks";

type Step = 1 | 2 | 3 | 4 | 5;

type Props = {
  uid: string;
  rockId: string;
  initialRock: any;
};

type BannerMsg = { kind: "error" | "ok"; text: string } | null;

type AiSuggestion = {
  id?: string;
  text?: string;
  recommended?: boolean;
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

function safeTrim(v: any): string {
  return safeStr(v).trim();
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
  // -----------------------------------------
  // Core state
  // -----------------------------------------

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

  // Step 1 banner (explicit actions only)
  const [draftBanner, setDraftBanner] = useState<BannerMsg>(null);

  // -----------------------------------------
  // New-doc creation + save scheduling
  // -----------------------------------------

  const aliveRef = useRef(true);
  const saveTimer = useRef<any>(null);
  const lastPatchRef = useRef<any>(null);
  const lastPatchKeyRef = useRef<string>("");

  // Monotonic sequencing prevents out-of-order "saved" UI
  const saveSeqRef = useRef(0);

  // Tracks whether Firestore doc exists / was created already
  const createdRef = useRef<boolean>(false);

  // If user navigates steps, don't let initialRock.step overwrite UI
  const userNavigatedStepRef = useRef(false);

  // -----------------------------------------
  // AI state (Option 3)
  // -----------------------------------------

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // -----------------------------------------
  // Mount/unmount guard
  // -----------------------------------------

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // -----------------------------------------
  // Sync when rockId / initialRock changes
  // -----------------------------------------

  useEffect(() => {
    userNavigatedStepRef.current = false;
  }, [rockId]);

  useEffect(() => {
    setRock((prev: any) => ({
      ...(prev || {}),
      ...(initialRock || {}),
      id: rockId,
      userId: uid,
      metrics: Array.isArray((initialRock || {})?.metrics) ? initialRock.metrics : prev?.metrics ?? [],
      milestones: Array.isArray((initialRock || {})?.milestones)
        ? initialRock.milestones
        : prev?.milestones ?? [],
    }));

    if (!userNavigatedStepRef.current && initialRock && initialRock.step !== undefined) {
      setStep(clampStep(initialRock.step));
    }
  }, [rockId, uid, initialRock]);

  // Determine whether we likely already have a doc
  useEffect(() => {
    const hasDoc =
      !!initialRock &&
      !!safeTrim(initialRock?.userId) &&
      !!safeTrim(initialRock?.id || rockId);

    createdRef.current = !!hasDoc;
  }, [initialRock, rockId]);

  // -----------------------------------------
  // Derived UI values
  // -----------------------------------------

  const title = useMemo(() => safeStr(rock?.title) || "Rock", [rock?.title]);
  const draft = useMemo(() => safeStr(rock?.draft), [rock?.draft]);

  const hasDraftContent = useMemo(() => {
    return safeTrim(rock?.title).length > 0 || safeTrim(rock?.draft).length > 0;
  }, [rock?.title, rock?.draft]);

  const hasAiSuggestion = useMemo(
    () => safeTrim(rock?.suggestedImprovement).length > 0,
    [rock?.suggestedImprovement]
  );

  // -----------------------------------------
  // Low-level persistence primitives
  // -----------------------------------------

  async function ensureCreatedIfNeeded(baseData?: any) {
    if (createdRef.current) return;

    const payload = stripUndefinedDeep({
      ...(baseData || {}),
      id: rockId,
      userId: uid,
      step: clampStep(baseData?.step),
      title: safeStr(baseData?.title ?? rock?.title),
      draft: safeStr(baseData?.draft ?? rock?.draft),
      metrics: Array.isArray(baseData?.metrics ?? rock?.metrics) ? (baseData?.metrics ?? rock?.metrics) : [],
      milestones: Array.isArray(baseData?.milestones ?? rock?.milestones)
        ? (baseData?.milestones ?? rock?.milestones)
        : [],
    });

    await createRockWithId(uid, rockId, payload);
    createdRef.current = true;
  }

  async function persistPatchNow(patch: any) {
    const cleaned = stripUndefinedDeep(patch || {});
    if (!cleaned || (typeof cleaned === "object" && Object.keys(cleaned).length === 0)) return;

    await ensureCreatedIfNeeded(cleaned);
    await updateRock(uid, rockId, cleaned);
  }

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
        await persistPatchNow(toSave);

        if (!aliveRef.current) return;
        if (mySeq !== saveSeqRef.current) return;

        setSaveState("saved");
      } catch (e: any) {
        devError("[RockBuilder] persistPatchNow failed:", e);

        if (!aliveRef.current) return;
        if (mySeq !== saveSeqRef.current) return;

        setSaveState("failed");
        setSaveError(e?.message || "Save failed.");
      }
    }, 450);
  }

  function updateField(path: string, value: any, opts?: { autosave?: boolean }) {
    const autosave = opts?.autosave !== false;

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

      if (autosave) {
        const patch: any = {};
        let pcur: any = patch;

        for (let i = 0; i < parts.length - 1; i++) {
          const key = parts[i]!;
          pcur[key] = pcur[key] && typeof pcur[key] === "object" ? pcur[key] : {};
          pcur = pcur[key];
        }

        pcur[parts[parts.length - 1]!] = value;
        scheduleSave(patch);
      }

      return next;
    });
  }

  function setMany(patch: any, opts?: { autosave?: boolean }) {
    const autosave = opts?.autosave !== false;

    setRock((prev: any) => {
      const next = { ...(prev || {}), ...(patch || {}) };
      if (autosave) scheduleSave(patch);
      return next;
    });
  }

  // -----------------------------------------
  // Footer-only step navigation
  // -----------------------------------------

  function goToStep(target: Step) {
    userNavigatedStepRef.current = true;
    setStep(() => {
      scheduleSave({ step: target });
      return target;
    });
  }

  function nextStep() {
    userNavigatedStepRef.current = true;
    setStep((s) => {
      const ns = s < 5 ? ((s + 1) as Step) : s;
      scheduleSave({ step: ns });
      return ns;
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

  // -----------------------------------------
  // Step 1 — Explicit actions only
  // -----------------------------------------

  const canDraftInteract = useMemo(() => {
    return !!safeTrim(uid) && !!safeTrim(rockId);
  }, [uid, rockId]);

  async function continueFromDraftExplicit() {
    if (!canDraftInteract) return;

    if (!hasDraftContent) {
      setDraftBanner({ kind: "error", text: "Add a title or a draft statement first." });
      return;
    }

    setDraftBanner(null);

    try {
      setSaveState("saving");
      setSaveError(null);

      await persistPatchNow({
        title: safeStr(rock?.title),
        draft: safeStr(rock?.draft),
        step: 2,
      });

      if (!aliveRef.current) return;

      setSaveState("saved");
      setStep(2);
    } catch (e: any) {
      if (!aliveRef.current) return;

      setSaveState("failed");
      setSaveError(e?.message || "Save failed.");
      setDraftBanner({ kind: "error", text: e?.message || "Save failed." });
    }
  }

  // -----------------------------------------
  // Option 3 — Improve with AI (apply + save + jump to Step 5)
  // -----------------------------------------

  async function improveWithAiOption3() {
    const d = safeTrim(rock?.draft);
    const t = safeTrim(rock?.title);

    if (!d && !t) {
      setDraftBanner({ kind: "error", text: "Add a title or a draft statement first." });
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setDraftBanner(null);

    try {
      setSaveState("saving");
      await persistPatchNow({
        title: safeStr(rock?.title),
        draft: safeStr(rock?.draft),
        step: 1,
      });

      const res = await fetch("/api/rock-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: safeStr(rock?.draft) }),
      });

      if (!res.ok) throw new Error(`AI request failed (${res.status}).`);

      const data = await res.json();

      const suggestions: AiSuggestion[] = Array.isArray(data?.suggestions)
        ? data.suggestions
        : Array.isArray(data)
          ? data
          : [];

      const top = safeTrim(suggestions?.[0]?.text);
      if (!top) throw new Error("AI did not return a suggestion.");

      setRock((prev: any) => ({
        ...(prev || {}),
        suggestedImprovement: top,
      }));

      await persistPatchNow({
        suggestedImprovement: top,
        step: 5,
      });

      if (!aliveRef.current) return;

      setSaveState("saved");
      setStep(5);
    } catch (e: any) {
      devError("[RockBuilder] improveWithAiOption3 failed:", e);

      if (!aliveRef.current) return;

      setSaveState("failed");
      setSaveError(e?.message || "AI suggestions are temporarily unavailable.");
      setAiError(e?.message || "AI suggestions are temporarily unavailable.");
      setDraftBanner({
        kind: "error",
        text: e?.message || "AI suggestions are temporarily unavailable.",
      });
    } finally {
      if (aliveRef.current) setAiLoading(false);
    }
  }

  // -----------------------------------------
  // Step 5 — Improve with AI (from Review screen)
  // -----------------------------------------

  async function improveWithAiFromReview() {
    const d = safeTrim(rock?.draft);
    const t = safeTrim(rock?.title);

    if (!d && !t) {
      setAiError("Add a title or a draft statement first.");
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      setSaveState("saving");
      setSaveError(null);

      await persistPatchNow({
        title: safeStr(rock?.title),
        draft: safeStr(rock?.draft),
        step: 5,
      });

      const res = await fetch("/api/rock-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: safeStr(rock?.draft), title: safeStr(rock?.title) }),
      });

      if (!res.ok) throw new Error(`AI request failed (${res.status}).`);

      const data = await res.json();

      const suggestions: AiSuggestion[] = Array.isArray(data?.suggestions)
        ? data.suggestions
        : Array.isArray(data)
          ? data
          : [];

      const top = safeTrim(suggestions?.[0]?.text);
      if (!top) throw new Error("AI did not return a suggestion.");

      setRock((prev: any) => ({
        ...(prev || {}),
        suggestedImprovement: top,
      }));

      await persistPatchNow({
        suggestedImprovement: top,
        step: 5,
      });

      if (!aliveRef.current) return;

      setSaveState("saved");
      setStep(5);
    } catch (e: any) {
      devError("[RockBuilder] improveWithAiFromReview failed:", e);

      if (!aliveRef.current) return;

      setSaveState("failed");
      setSaveError(e?.message || "AI suggestions are temporarily unavailable.");
      setAiError(e?.message || "AI suggestions are temporarily unavailable.");
    } finally {
      if (aliveRef.current) setAiLoading(false);
    }
  }

  // -----------------------------------------
  // Step 2 helper
  // -----------------------------------------

  function buildFinalFromSmart() {
    const s = safeTrim(rock?.smart?.specific);
    const m = safeTrim(rock?.smart?.measurable);
    const t = safeTrim(rock?.smart?.timebound);

    const base = s || safeTrim(rock?.suggestedImprovement) || safeTrim(rock?.draft) || title;
    const metric = m ? ` (${m})` : "";
    const due = t ? ` — Due ${t}` : "";

    const final = `${base}${metric}${due}`.trim();

    setMany({ finalStatement: final }, { autosave: true });
    goToStep(5);
  }

  // -----------------------------------------
  // Footer actions
  // -----------------------------------------

  const footerPrimaryLabel = useMemo(() => {
    if (step === 1) return "Continue to SMART";
    if (step === 5) return hasAiSuggestion ? "Done" : "Improve with AI";
    return "Continue";
  }, [step, hasAiSuggestion]);

  async function footerPrimaryAction() {
    if (step === 1) {
      await continueFromDraftExplicit();
      return;
    }

    if (step === 5) {
      if (!hasAiSuggestion) {
        await improveWithAiFromReview();
      }
      return;
    }

    nextStep();
  }

  const footerPrimaryDisabled = useMemo(() => {
    if (saveState === "saving" || aiLoading) return true;
    if (step === 1 && !hasDraftContent) return true;
    if (step === 5 && hasAiSuggestion) return true; // "Done" is intentionally disabled
    return false;
  }, [saveState, aiLoading, step, hasDraftContent, hasAiSuggestion]);

  // -----------------------------------------
  // UI
  // -----------------------------------------

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
            {draft ? (
              <div style={sub}>{draft}</div>
            ) : (
              <div style={subMuted}>Build clear Rocks. Track them weekly.</div>
            )}
          </div>
        </div>

        {saveError && (
          <div style={alert}>
            <div style={alertTitle}>Heads up</div>
            <div style={alertBody}>{saveError}</div>
          </div>
        )}

        {/* ======================================================
            STEP 1 — DRAFT (NO AUTOSAVE WHILE TYPING)
           ====================================================== */}
        {step === 1 && (
          <StepDraft
            rock={rock}
            onChange={(next) => {
              setRock(next);
            }}
            saving={saveState === "saving" || aiLoading}
            saved={saveState === "saved"}
            banner={draftBanner}
            canInteract={canDraftInteract && !aiLoading}
            onImproveWithAI={improveWithAiOption3}
          />
        )}

        {/* ======================================================
            STEP 2 — SMART (autosave OK)
           ====================================================== */}
        {step === 2 && (
          <StepSmart
            rock={rock}
            onUpdateField={(path, value) => updateField(path, value, { autosave: true })}
            onBuildFinal={buildFinalFromSmart}
          />
        )}

        {/* ======================================================
            STEP 3 — METRICS (autosave OK)
           ====================================================== */}
        {step === 3 && (
          <StepMetrics
            value={safeStr(rock?.metricsText)}
            onChange={(next) => updateField("metricsText", next, { autosave: true })}
          />
        )}

        {/* ======================================================
            STEP 4 — MILESTONES (autosave OK) ✅ MOVED OUT
           ====================================================== */}
        {step === 4 && (
          <StepMilestones
            value={safeStr(rock?.milestonesText)}
            onChange={(next) => updateField("milestonesText", next, { autosave: true })}
          />
        )}

        {/* ======================================================
            STEP 5 — REVIEW + AI (autosave OK)
           ====================================================== */}
        {step === 5 && (
          <div style={section}>
            <div style={sectionTitle}>Step 5 — Review + AI</div>
            <div style={sectionHint}>Review your Rock. Your AI suggestion (if any) is here.</div>

            <label style={label}>
              <div style={labelText}>Final Rock statement</div>
              <textarea
                style={textarea}
                value={safeStr(rock?.finalStatement)}
                onChange={(e) => updateField("finalStatement", e.target.value, { autosave: true })}
                placeholder="This is what you’ll share with your leadership team."
              />
            </label>

            <label style={label}>
              <div style={labelText}>Suggested Improvement (from AI)</div>
              <textarea
                style={textarea}
                value={safeStr(rock?.suggestedImprovement)}
                onChange={(e) => updateField("suggestedImprovement", e.target.value, { autosave: true })}
                placeholder="AI suggestion will appear here after you click Improve with AI."
              />
              {aiError && <div style={tinyError}>{aiError}</div>}
              <div style={tip}>Tip: Keep it simple. Make it clearer, not perfect.</div>
            </label>
          </div>
        )}

        {/* ======================================================
            FOOTER — ONLY NAVIGATION (TWO BUTTONS)
           ====================================================== */}
        <div style={footer}>
          <div style={footerLeft}>Step {step} of 5</div>

          <div style={footerRight}>
            <Button type="button" onClick={prevStep} disabled={step === 1}>
              Back
            </Button>

            <Button type="button" onClick={footerPrimaryAction} disabled={footerPrimaryDisabled}>
              {footerPrimaryLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   Labels
------------------------------ */

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
  fontWeight: 800,
  opacity: 0.85,
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

const tinyError: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  fontWeight: 800,
  color: "rgba(255,140,140,0.95)",
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
