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

import type { AiSuggestion, BannerMsg, Props, Step } from "./rockBuilder/types";
import {
  clampStep,
  devError,
  safeStr,
  safeTrim,
  stableStringify,
  stripUndefinedDeep,
} from "./rockBuilder/utils";
import { stepName, styles } from "./rockBuilder/uiStyles";

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
      !!initialRock && !!safeTrim(initialRock?.userId) && !!safeTrim(initialRock?.id || rockId);

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
      metrics: Array.isArray(baseData?.metrics ?? rock?.metrics) ? baseData?.metrics ?? rock?.metrics : [],
      milestones: Array.isArray(baseData?.milestones ?? rock?.milestones)
        ? baseData?.milestones ?? rock?.milestones
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

      setRock((prev: any) => ({ ...(prev || {}), suggestedImprovement: top }));

      await persistPatchNow({ suggestedImprovement: top, step: 5 });

      if (!aliveRef.current) return;

      setSaveState("saved");
      setStep(5);
    } catch (e: any) {
      devError("[RockBuilder] improveWithAiOption3 failed:", e);

      if (!aliveRef.current) return;

      setSaveState("failed");
      setSaveError(e?.message || "AI suggestions are temporarily unavailable.");
      setAiError(e?.message || "AI suggestions are temporarily unavailable.");
      setDraftBanner({ kind: "error", text: e?.message || "AI suggestions are temporarily unavailable." });
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

      setRock((prev: any) => ({ ...(prev || {}), suggestedImprovement: top }));

      await persistPatchNow({ suggestedImprovement: top, step: 5 });

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
      if (!hasAiSuggestion) await improveWithAiFromReview();
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
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <div style={styles.brandRow}>
            <span style={styles.brandOrange}>Pocket</span>
            <span style={styles.brandWhite}>Rocks</span>
          </div>
          <div style={styles.crumb}>ROCK · {stepName(step)}</div>
        </div>

        <div style={styles.savePillWrap}>
          {saveState === "saving" && <div style={styles.pill}>Saving…</div>}
          {saveState === "saved" && <div style={{ ...styles.pill, opacity: 0.85 }}>Saved</div>}
          {saveState === "failed" && <div style={{ ...styles.pill, ...styles.pillFail }}>Save failed</div>}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHdr}>
          <div>
            <div style={styles.eyebrow}>{stepName(step)}</div>
            <div style={styles.h1}>{title}</div>
            {draft ? <div style={styles.sub}>{draft}</div> : <div style={styles.subMuted}>Build clear Rocks. Track them weekly.</div>}
          </div>
        </div>

        {saveError && (
          <div style={styles.alert}>
            <div style={styles.alertTitle}>Heads up</div>
            <div style={styles.alertBody}>{saveError}</div>
          </div>
        )}

        {step === 1 && (
          <StepDraft
            rock={rock}
            onChange={(next) => setRock(next)}
            saving={saveState === "saving" || aiLoading}
            saved={saveState === "saved"}
            banner={draftBanner}
            canInteract={!!safeTrim(uid) && !!safeTrim(rockId) && !aiLoading}
            onImproveWithAI={improveWithAiOption3}
          />
        )}

        {step === 2 && (
          <StepSmart
            rock={rock}
            onUpdateField={(path, value) => updateField(path, value, { autosave: true })}
            onBuildFinal={buildFinalFromSmart}
          />
        )}

        {step === 3 && (
          <StepMetrics
            value={safeStr(rock?.metricsText)}
            onChange={(next) => updateField("metricsText", next, { autosave: true })}
          />
        )}

        {step === 4 && (
          <StepMilestones
            value={safeStr(rock?.milestonesText)}
            onChange={(next) => updateField("milestonesText", next, { autosave: true })}
          />
        )}

        {step === 5 && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Step 5 — Review + AI</div>
            <div style={styles.sectionHint}>Review your Rock. Your AI suggestion (if any) is here.</div>

            <label style={styles.label}>
              <div style={styles.labelText}>Final Rock statement</div>
              <textarea
                style={styles.textarea}
                value={safeStr(rock?.finalStatement)}
                onChange={(e) => updateField("finalStatement", e.target.value, { autosave: true })}
                placeholder="This is what you’ll share with your leadership team."
              />
            </label>

            <label style={styles.label}>
              <div style={styles.labelText}>Suggested Improvement (from AI)</div>
              <textarea
                style={styles.textarea}
                value={safeStr(rock?.suggestedImprovement)}
                onChange={(e) => updateField("suggestedImprovement", e.target.value, { autosave: true })}
                placeholder="AI suggestion will appear here after you click Improve with AI."
              />
              {aiError && <div style={styles.tinyError}>{aiError}</div>}
              <div style={styles.tip}>Tip: Keep it simple. Make it clearer, not perfect.</div>
            </label>
          </div>
        )}

        <div style={styles.footer}>
          <div style={styles.footerLeft}>Step {step} of 5</div>

          <div style={styles.footerRight}>
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
