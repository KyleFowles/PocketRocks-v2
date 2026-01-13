// FILE: src/components/RockBuilder.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Metric, Milestone, Rock } from "@/types/rock";
import { Button } from "@/components/Button";

type Step = 1 | 2 | 3 | 4 | 5;

type AiSuggestion = {
  id: string;
  text: string;
  recommended?: boolean;
};

function uid() {
  return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function safeTrim(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

function buildFinalFromRock(r: Rock) {
  const title = safeTrim(r.title) || safeTrim(r.draft) || "Rock";
  const due = safeTrim(r.dueDate) || "—";

  const metricsLine =
    (r.metrics?.length ?? 0) > 0
      ? `Metrics: ${r.metrics
          .map((m: any) => {
            const name = safeTrim(m.name) || "Metric";
            const target = safeTrim(m.target) || "—";
            const current = safeTrim(m.current);
            return `${name} (Target: ${target}${current ? `, Current: ${current}` : ""})`;
          })
          .join("; ")}`
      : "";

  const milestonesLine =
    (r.milestones?.length ?? 0) > 0
      ? `Milestones: ${r.milestones
          .map((ms: any) => {
            const text = safeTrim(ms.text) || "Milestone";
            const dd = safeTrim(ms.dueDate);
            return `${text}${dd ? ` (${dd})` : ""}`;
          })
          .join("; ")}`
      : "";

  const line1 = `${title} — Due ${due}.`;
  const detailLines = [metricsLine, milestonesLine].filter(Boolean);

  return [line1, ...detailLines.map((x) => `${x}.`)].filter(Boolean).join("\n");
}

async function postJson(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg =
      safeTrim(data?.error) ||
      safeTrim(data?.message) ||
      safeTrim(text) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

export default function RockBuilder(props: {
  initialRock: Rock;
  onSave: (rock: Rock) => Promise<void>;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [rock, setRock] = useState<Rock>(props.initialRock);

  // Autosave UI
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const autosaveTimerRef = useRef<any>(null);
  const mountedRef = useRef(false);
  const lastSavedSnapshotRef = useRef<string>("");

  // AI UI
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [followup, setFollowup] = useState<string | null>(null);

  const canContinue = useMemo(() => {
    if (step === 1) return safeTrim(rock.draft).length >= 8;
    if (step === 2)
      return (
        safeTrim(rock.specific).length >= 5 &&
        safeTrim(rock.measurable).length >= 5 &&
        safeTrim(rock.achievable).length >= 5 &&
        safeTrim(rock.relevant).length >= 5 &&
        safeTrim(rock.timeBound).length >= 5
      );
    if (step === 3) return (rock.metrics?.length ?? 0) >= 1;
    if (step === 4) return (rock.milestones?.length ?? 0) >= 3;
    return true;
  }, [step, rock]);

  const computedFinalStatement = useMemo(() => {
    return buildFinalFromRock(rock);
  }, [rock]);

  function next() {
    setErr(null);
    if (!canContinue) return;
    setStep((s) => (s < 5 ? ((s + 1) as Step) : s));
  }

  function back() {
    setErr(null);
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  function set<K extends keyof Rock>(key: K, value: Rock[K]) {
    setRock((r) => ({ ...r, [key]: value }));
    setDirty(true);
    setSaving("idle");
    setAppliedId(null);
  }

  function addMetric() {
    const id = `m_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
    const metric: Metric = { id, name: "", target: "", current: "" };
    setRock((r) => ({ ...r, metrics: [...(r.metrics ?? []), metric] }));
    setDirty(true);
    setSaving("idle");
  }

  function updateMetric(id: string, patch: Partial<Metric>) {
    setRock((r) => ({
      ...r,
      metrics: (r.metrics ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
    setDirty(true);
    setSaving("idle");
  }

  function removeMetric(id: string) {
    setRock((r) => ({ ...r, metrics: (r.metrics ?? []).filter((m) => m.id !== id) }));
    setDirty(true);
    setSaving("idle");
  }

  function addMilestone() {
    const id = `ms_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
    const ms: Milestone = { id, text: "", dueDate: "", completed: false };
    setRock((r) => ({ ...r, milestones: [...(r.milestones ?? []), ms] }));
    setDirty(true);
    setSaving("idle");
  }

  function updateMilestone(id: string, patch: Partial<Milestone>) {
    setRock((r) => ({
      ...r,
      milestones: (r.milestones ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
    setDirty(true);
    setSaving("idle");
  }

  function removeMilestone(id: string) {
    setRock((r) => ({ ...r, milestones: (r.milestones ?? []).filter((m) => m.id !== id) }));
    setDirty(true);
    setSaving("idle");
  }

  function buildFinalStatement() {
    setErr(null);
    const built = buildFinalFromRock(rock);
    set("finalStatement", built as any);
  }

  // -----------------------------
  // Autosave (debounced)
  // -----------------------------

  const normalizedPayloadForSave = useMemo(() => {
    const title = safeTrim(rock.title) || safeTrim(rock.draft).slice(0, 60);
    const finalStatement = safeTrim((rock as any).finalStatement) || computedFinalStatement;

    const metrics = (rock.metrics ?? [])
      .map((m: any) => ({
        ...m,
        name: safeTrim(m.name),
        target: safeTrim(m.target),
        current: safeTrim(m.current),
      }))
      .filter((m: any) => m.name && m.target);

    const milestones = (rock.milestones ?? [])
      .map((m: any) => ({
        ...m,
        text: safeTrim(m.text),
        dueDate: safeTrim(m.dueDate),
        completed: !!m.completed,
      }))
      .filter((m: any) => m.text);

    const status = (rock as any).status || "on_track";

    const payload: Rock = {
      ...rock,
      title,
      finalStatement,
      status,
      metrics,
      milestones,
    };

    return payload;
  }, [rock, computedFinalStatement]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      lastSavedSnapshotRef.current = JSON.stringify(normalizedPayloadForSave);
      return;
    }

    if (!dirty) return;

    const snapshot = JSON.stringify(normalizedPayloadForSave);
    if (snapshot === lastSavedSnapshotRef.current) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      setSaving("saving");
      try {
        await props.onSave(normalizedPayloadForSave);
        lastSavedSnapshotRef.current = JSON.stringify(normalizedPayloadForSave);
        setSaving("saved");
        setSavedAt(Date.now());
        setDirty(false);
      } catch {
        setSaving("error");
      }
    }, 800);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [dirty, normalizedPayloadForSave, props]);

  // -----------------------------
  // AI Suggestions
  // -----------------------------

  function maybeSetFollowup() {
    const d = safeTrim(rock.draft);
    const s = safeTrim(rock.specific);
    const m = safeTrim(rock.measurable);

    if (d.length < 8) {
      setFollowup("What is your Rock idea in one simple sentence?");
      return true;
    }
    if (!s && !m) {
      setFollowup("How will you know this Rock is done? (One measurable sign)");
      return true;
    }

    setFollowup(null);
    return false;
  }

  async function generateSuggestions() {
    setAiErr(null);
    setAppliedId(null);

    if (maybeSetFollowup()) {
      setAiSuggestions([]);
      return;
    }

    setAiBusy(true);
    try {
      const data = await postJson("/api/rock-suggest", {
        rock: normalizedPayloadForSave,
        context: { mode: "suggestions", requested: 5 },
      });

      // ✅ Strict typing so we don't get implicit-any in filter/some
      const raw: unknown[] = Array.isArray(data?.suggestions) ? (data.suggestions as unknown[]) : [];

      const items: AiSuggestion[] = raw
        .map((s: unknown, i: number): AiSuggestion => ({
          id: uid(),
          text: safeTrim(s),
          recommended: i === 0,
        }))
        .filter((x: AiSuggestion) => Boolean(x.text));

      if (items.length && !items.some((x: AiSuggestion) => Boolean(x.recommended))) {
        const first = items[0];
        if (first) first.recommended = true;
      }
      
      setAiSuggestions(items);
      if (!items.length) setAiErr("No suggestions came back. Try again.");
    } catch (e: any) {
      setAiErr(typeof e?.message === "string" ? e.message : "Could not generate suggestions.");
    } finally {
      setAiBusy(false);
    }
  }

  function applySuggestion(s: AiSuggestion) {
    setAiErr(null);
    setAppliedId(s.id);
    set("finalStatement", s.text as any);
  }

  async function saveNow() {
    setErr(null);
    setBusy(true);

    try {
      const metricsOk =
        (normalizedPayloadForSave.metrics?.length ?? 0) >= 1 &&
        normalizedPayloadForSave.metrics.every((m: any) => safeTrim(m.name) && safeTrim(m.target));
      const milestonesOk = (normalizedPayloadForSave.milestones?.length ?? 0) >= 3;

      if (!metricsOk) throw new Error("Please add at least 1 metric with a name and target.");
      if (!milestonesOk) throw new Error("Please add at least 3 milestones.");

      await props.onSave(normalizedPayloadForSave);

      lastSavedSnapshotRef.current = JSON.stringify(normalizedPayloadForSave);
      setSaving("saved");
      setSavedAt(Date.now());
      setDirty(false);
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "Could not save Rock.";
      setErr(msg);
      setSaving("error");
      setBusy(false);
      return;
    }

    setBusy(false);
  }

  const saveStatusText = useMemo(() => {
    if (saving === "saving") return "Saving…";
    if (saving === "saved") {
      if (!savedAt) return "Saved";
      const secs = Math.max(0, Math.floor((Date.now() - savedAt) / 1000));
      return secs <= 5 ? "Saved" : `Saved ${secs}s ago`;
    }
    if (saving === "error") return "Save failed";
    if (dirty) return "Unsaved changes";
    return "Saved";
  }, [saving, savedAt, dirty]);

  return (
    <div style={shell}>
      <div style={topRow}>
        <StepHeader step={step} onStepClick={(n) => setStep(n)} />
        <div style={savePillWrap}>
          <div style={savePill} aria-live="polite">
            <span style={dot(saving, dirty)} />
            <span>{saveStatusText}</span>
          </div>
        </div>
      </div>

      {err && <Alert text={err} />}

      {step === 1 && (
        <Card title="Step 1 — Draft">
          <p style={muted}>Write your rough Rock idea in one sentence. Don’t overthink it.</p>

          <Field label="Draft Rock">
            <textarea
              value={rock.draft}
              onChange={(e) => set("draft", e.target.value as any)}
              placeholder="Example: Improve customer response time."
              style={{ ...input, minHeight: 90 }}
            />
          </Field>

          <Field label="Rock title (optional)">
            <input
              value={rock.title}
              onChange={(e) => set("title", e.target.value as any)}
              placeholder="Example: Faster Customer Response"
              style={input}
            />
          </Field>

          <Field label="Due date">
            <input
              value={rock.dueDate}
              onChange={(e) => set("dueDate", e.target.value as any)}
              type="date"
              style={input}
            />
          </Field>
        </Card>
      )}

      {step === 2 && (
        <Card title="Step 2 — SMART coaching">
          <div style={between}>
            <p style={{ ...muted, marginBottom: 0 }}>
              Answer each one in simple words. These answers become your Rock’s backbone.
            </p>

            <Button type="button" onClick={buildFinalStatement} style={btnPrimary}>
              Build Final Statement
            </Button>
          </div>

          <Field label="Specific — What exactly will be different when this is done?">
            <textarea
              value={rock.specific}
              onChange={(e) => set("specific", e.target.value as any)}
              style={{ ...input, minHeight: 70 }}
              placeholder="What will be true when this Rock is complete?"
            />
          </Field>

          <Field label="Measurable — How will you prove it is complete?">
            <textarea
              value={rock.measurable}
              onChange={(e) => set("measurable", e.target.value as any)}
              style={{ ...input, minHeight: 70 }}
              placeholder="Numbers, counts, percentages, deadlines."
            />
          </Field>

          <Field label="Achievable — Why is this realistic this quarter?">
            <textarea
              value={rock.achievable}
              onChange={(e) => set("achievable", e.target.value as any)}
              style={{ ...input, minHeight: 70 }}
              placeholder="Resources, capacity, scope boundaries."
            />
          </Field>

          <Field label="Relevant — Why does this matter right now?">
            <textarea
              value={rock.relevant}
              onChange={(e) => set("relevant", e.target.value as any)}
              style={{ ...input, minHeight: 70 }}
              placeholder="What does it support? What problem does it solve?"
            />
          </Field>

          <Field label="Time-bound — When is it fully done?">
            <textarea
              value={rock.timeBound}
              onChange={(e) => set("timeBound", e.target.value as any)}
              style={{ ...input, minHeight: 70 }}
              placeholder="Example: Complete by March 31 with weekly checkpoints."
            />
          </Field>

          <div style={miniCard}>
            <div style={miniCardTitle}>Final Rock statement</div>
            <div style={mutedSmall}>Click “Build Final Statement” or write your own.</div>

            <textarea
              value={safeTrim((rock as any).finalStatement) || ""}
              onChange={(e) => set("finalStatement" as any, e.target.value as any)}
              placeholder="Final Rock statement..."
              style={{ ...input, minHeight: 110, marginTop: 10, whiteSpace: "pre-wrap" }}
            />
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card title="Step 3 — Metrics">
          <p style={muted}>Add 1–3 measures that prove success. Keep it simple.</p>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <Button type="button" onClick={addMetric} style={btnPrimary}>
              + Add Metric
            </Button>
            <div style={mutedSmall}>At least 1 metric is required.</div>
          </div>

          {(rock.metrics?.length ?? 0) === 0 ? (
            <div style={empty}>No metrics yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {(rock.metrics ?? []).map((m: any) => (
                <div key={m.id} style={rowCard}>
                  <div style={{ display: "grid", gap: 10 }}>
                    <Field label="Metric name">
                      <input
                        value={m.name}
                        onChange={(e) => updateMetric(m.id, { name: e.target.value } as any)}
                        placeholder="Example: Average first response time"
                        style={input}
                      />
                    </Field>

                    <Field label="Target">
                      <input
                        value={m.target}
                        onChange={(e) => updateMetric(m.id, { target: e.target.value } as any)}
                        placeholder="Example: Under 2 hours"
                        style={input}
                      />
                    </Field>

                    <Field label="Current (optional)">
                      <input
                        value={m.current ?? ""}
                        onChange={(e) => updateMetric(m.id, { current: e.target.value } as any)}
                        placeholder="Example: 6 hours"
                        style={input}
                      />
                    </Field>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                    <Button type="button" onClick={() => removeMetric(m.id)} style={btnGhost}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {step === 4 && (
        <Card title="Step 4 — Milestones">
          <p style={muted}>Add 3–7 milestones. Make them concrete actions.</p>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <Button type="button" onClick={addMilestone} style={btnPrimary}>
              + Add Milestone
            </Button>
            <div style={mutedSmall}>At least 3 milestones are required.</div>
          </div>

          {(rock.milestones?.length ?? 0) === 0 ? (
            <div style={empty}>No milestones yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {(rock.milestones ?? []).map((m: any) => (
                <div key={m.id} style={rowCard}>
                  <div style={{ display: "grid", gap: 10 }}>
                    <Field label="Milestone">
                      <input
                        value={m.text}
                        onChange={(e) => updateMilestone(m.id, { text: e.target.value } as any)}
                        placeholder="Example: Define response-time SLA and train team"
                        style={input}
                      />
                    </Field>

                    <Field label="Due date (optional)">
                      <input
                        value={m.dueDate ?? ""}
                        onChange={(e) => updateMilestone(m.id, { dueDate: e.target.value } as any)}
                        type="date"
                        style={input}
                      />
                    </Field>

                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={!!m.completed}
                        onChange={(e) => updateMilestone(m.id, { completed: e.target.checked } as any)}
                      />
                      <span>Completed</span>
                    </label>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                    <Button type="button" onClick={() => removeMilestone(m.id)} style={btnGhost}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {step === 5 && (
        <Card title="Step 5 — Review + AI">
          <p style={muted}>Review your Rock. Use AI to improve the final statement. Save anytime.</p>

          <div style={aiPanel}>
            <div style={aiTop}>
              <div>
                <div style={aiTitle}>AI Suggestions</div>
                <div style={mutedSmall}>Generate 3–5 better final Rock statements. Apply with one click.</div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Button type="button" onClick={generateSuggestions} style={btnPrimary} disabled={aiBusy}>
                  {aiBusy ? "Generating…" : aiSuggestions.length ? "Regenerate" : "Generate Suggestions"}
                </Button>
                <Button type="button" onClick={buildFinalStatement} style={btnGhost}>
                  Build from SMART
                </Button>
              </div>
            </div>

            {followup && (
              <div style={followupBox}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Quick question</div>
                <div style={{ marginBottom: 10 }}>{followup}</div>
                <Button type="button" onClick={() => setStep(1)} style={btnGhost}>
                  Go to Draft
                </Button>
              </div>
            )}

            {aiErr && <Alert text={aiErr} />}

            {aiSuggestions.length === 0 && !aiBusy && !aiErr && !followup && (
              <div style={empty}>
                Click <strong>Generate Suggestions</strong> to get better final statements you can apply instantly.
              </div>
            )}

            {aiSuggestions.length > 0 && (
              <div style={{ display: "grid", gap: 10 }}>
                {aiSuggestions.map((s) => {
                  const isApplied = appliedId === s.id;
                  return (
                    <div key={s.id} style={suggestionCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ display: "grid", gap: 8 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            {s.recommended && <span style={badge}>Recommended</span>}
                            {isApplied && <span style={badgeOk}>Applied ✓</span>}
                          </div>
                          <div style={suggestionText}>{s.text}</div>
                        </div>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <Button type="button" onClick={() => applySuggestion(s)} style={btnPrimary}>
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={miniCard}>
            <div style={miniCardTitle}>Final Rock statement</div>
            <div style={mutedSmall}>This is what you’ll share with your leadership team.</div>

            <textarea
              value={safeTrim((rock as any).finalStatement) || ""}
              onChange={(e) => set("finalStatement" as any, e.target.value as any)}
              placeholder="Write it here or apply an AI suggestion."
              style={{ ...input, minHeight: 120, marginTop: 10, whiteSpace: "pre-wrap" }}
            />

            {!safeTrim((rock as any).finalStatement) && (
              <div style={{ marginTop: 10, ...mutedSmall }}>
                Built preview (if you leave Final blank):
                <pre style={previewPre}>{computedFinalStatement}</pre>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            <div style={reviewBox}>
              <div style={reviewLabel}>Draft</div>
              <div style={reviewText}>{rock.draft || "—"}</div>
            </div>

            <div style={reviewBox}>
              <div style={reviewLabel}>SMART</div>
              <div style={reviewText}>
                <div style={reviewList}>
                  <div>
                    <strong>Specific:</strong> {rock.specific || "—"}
                  </div>
                  <div>
                    <strong>Measurable:</strong> {rock.measurable || "—"}
                  </div>
                  <div>
                    <strong>Achievable:</strong> {rock.achievable || "—"}
                  </div>
                  <div>
                    <strong>Relevant:</strong> {rock.relevant || "—"}
                  </div>
                  <div>
                    <strong>Time-bound:</strong> {rock.timeBound || "—"}
                  </div>
                </div>
              </div>
            </div>

            <div style={reviewBox}>
              <div style={reviewLabel}>Metrics</div>
              <div style={reviewText}>
                {(rock.metrics?.length ?? 0) === 0 ? (
                  "—"
                ) : (
                  <ul style={ul}>
                    {(rock.metrics ?? []).map((m: any) => (
                      <li key={m.id}>
                        {m.name || "(Metric)"} — Target: {m.target || "—"}
                        {m.current ? ` (Current: ${m.current})` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div style={reviewBox}>
              <div style={reviewLabel}>Milestones</div>
              <div style={reviewText}>
                {(rock.milestones?.length ?? 0) === 0 ? (
                  "—"
                ) : (
                  <ul style={ul}>
                    {(rock.milestones ?? []).map((m: any) => (
                      <li key={m.id}>
                        {m.completed ? "✅ " : "⬜ "} {m.text || "(Milestone)"}
                        {m.dueDate ? ` — ${m.dueDate}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, ...mutedSmall }}>
            Tip: Your changes autosave. You can also click “Save Rock” below any time.
          </div>
        </Card>
      )}

      <div style={footer}>
        <div style={{ display: "flex", gap: 10 }}>
          {props.onCancel && (
            <Button type="button" onClick={props.onCancel} style={btnGhost} disabled={busy}>
              Cancel
            </Button>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button type="button" onClick={back} style={btnGhost} disabled={busy || step === 1}>
            Back
          </Button>

          {step < 5 ? (
            <Button
              type="button"
              onClick={next}
              style={canContinue ? btnPrimary : btnDisabled}
              disabled={!canContinue || busy}
            >
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={saveNow} style={btnPrimary} disabled={busy}>
              {busy ? "Saving..." : "Save Rock"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   Small UI components
------------------------------ */

function StepHeader(props: { step: Step; onStepClick: (step: Step) => void }) {
  const steps: { n: Step; label: string }[] = [
    { n: 1, label: "Draft" },
    { n: 2, label: "SMART" },
    { n: 3, label: "Metrics" },
    { n: 4, label: "Milestones" },
    { n: 5, label: "Review + AI" },
  ];

  return (
    <div style={stepHeader}>
      <div style={brand}>
        <div style={brandTitle}>SMART Rocks</div>
        <div style={brandSub}>Build clear Rocks. Track them weekly.</div>
      </div>

      <div style={stepPills}>
        {steps.map((s) => {
          const active = s.n === props.step;
          return (
            <Button
              key={s.n}
              type="button"
              onClick={() => props.onStepClick(s.n)}
              style={active ? pillActive : pill}
              aria-current={active ? "step" : undefined}
            >
              {s.n}. {s.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function Card(props: { title: string; children: React.ReactNode }) {
  return (
    <div style={card}>
      <div style={cardTitle}>{props.title}</div>
      <div style={{ display: "grid", gap: 14 }}>{props.children}</div>
    </div>
  );
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={label}>{props.label}</div>
      {props.children}
    </label>
  );
}

function Alert(props: { text: string }) {
  return (
    <div style={alert}>
      <strong style={{ display: "block", marginBottom: 6 }}>Heads up</strong>
      <div>{props.text}</div>
    </div>
  );
}

/* -----------------------------
   Styles
------------------------------ */

const shell: React.CSSProperties = {
  maxWidth: 920,
  margin: "0 auto",
  padding: "28px 18px 24px",
};

const topRow: React.CSSProperties = {
  display: "grid",
  gap: 10,
  marginBottom: 16,
};

const savePillWrap: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
};

const savePill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  borderRadius: 999,
  padding: "8px 12px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.25)",
  color: "rgba(255,255,255,0.85)",
  fontSize: 13,
};

function dot(saving: "idle" | "saving" | "saved" | "error", dirty: boolean): React.CSSProperties {
  let bg = "rgba(255,255,255,0.35)";
  if (saving === "saving") bg = "rgba(255,121,0,0.9)";
  if (saving === "saved" && !dirty) bg = "rgba(80,255,160,0.9)";
  if (saving === "error") bg = "rgba(255,80,80,0.9)";
  if (dirty && saving !== "saving") bg = "rgba(255,255,255,0.45)";

  return {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: bg,
    boxShadow: "0 0 0 3px rgba(0,0,0,0.25)",
  };
}

const between: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const brand: React.CSSProperties = {
  display: "grid",
  gap: 4,
};

const brandTitle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  letterSpacing: 0.2,
};

const brandSub: React.CSSProperties = {
  color: "rgba(255,255,255,0.65)",
  fontSize: 14,
};

const stepHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 16,
};

const stepPills: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const pill: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.25)",
  color: "rgba(255,255,255,0.85)",
  padding: "8px 10px",
  borderRadius: 999,
  fontSize: 13,
  cursor: "pointer",
};

const pillActive: React.CSSProperties = {
  ...pill,
  background: "rgba(255,121,0,0.18)",
  border: "1px solid rgba(255,121,0,0.45)",
  color: "white",
  fontWeight: 700,
};

const card: React.CSSProperties = {
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
};

const cardTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  marginBottom: 12,
};

const label: React.CSSProperties = {
  fontSize: 13,
  color: "rgba(255,255,255,0.85)",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  outline: "none",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,0.65)",
  marginTop: 0,
  marginBottom: 6,
};

const mutedSmall: React.CSSProperties = {
  color: "rgba(255,255,255,0.55)",
  fontSize: 13,
};

const empty: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: "1px dashed rgba(255,255,255,0.18)",
  color: "rgba(255,255,255,0.65)",
};

const rowCard: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.35)",
  padding: 12,
};

const btnBase: React.CSSProperties = {
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.12)",
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: "#FF7900",
  border: "1px solid rgba(255,121,0,0.65)",
  color: "#101010",
  fontWeight: 800,
};

const btnDisabled: React.CSSProperties = {
  ...btnBase,
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "rgba(255,255,255,0.55)",
  cursor: "not-allowed",
};

const btnGhost: React.CSSProperties = {
  ...btnBase,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "rgba(255,255,255,0.85)",
};

const footer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginTop: 14,
};

const alert: React.CSSProperties = {
  borderRadius: 14,
  padding: 14,
  border: "1px solid rgba(255,80,80,0.35)",
  background: "rgba(255,80,80,0.10)",
  color: "white",
};

const checkRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  color: "rgba(255,255,255,0.85)",
  fontSize: 14,
};

const reviewBox: React.CSSProperties = {
  borderRadius: 14,
  padding: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.30)",
};

const reviewLabel: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(255,255,255,0.65)",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: 0.8,
};

const reviewText: React.CSSProperties = {
  color: "rgba(255,255,255,0.92)",
  fontSize: 14,
  lineHeight: 1.45,
};

const reviewList: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const ul: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
};

const miniCard: React.CSSProperties = {
  borderRadius: 16,
  padding: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.32)",
};

const miniCardTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  marginBottom: 6,
};

const previewPre: React.CSSProperties = {
  marginTop: 8,
  whiteSpace: "pre-wrap",
  fontSize: 12,
  lineHeight: 1.45,
  color: "rgba(255,255,255,0.82)",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 12,
  padding: 10,
};

const aiPanel: React.CSSProperties = {
  borderRadius: 16,
  padding: 14,
  border: "1px solid rgba(255,121,0,0.20)",
  background: "rgba(255,121,0,0.06)",
};

const aiTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

const aiTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
};

const suggestionCard: React.CSSProperties = {
  borderRadius: 14,
  padding: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.28)",
};

const suggestionText: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  color: "rgba(255,255,255,0.92)",
  fontSize: 14,
  lineHeight: 1.45,
};

const badge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 800,
  borderRadius: 999,
  padding: "5px 10px",
  border: "1px solid rgba(255,121,0,0.45)",
  background: "rgba(255,121,0,0.16)",
  color: "white",
};

const badgeOk: React.CSSProperties = {
  ...badge,
  border: "1px solid rgba(80,255,160,0.35)",
  background: "rgba(80,255,160,0.12)",
};

const followupBox: React.CSSProperties = {
  borderRadius: 14,
  padding: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.28)",
  color: "rgba(255,255,255,0.92)",
};
