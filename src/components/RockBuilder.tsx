// src/components/RockBuilder.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { Metric, Milestone, Rock } from "@/types/rock";

type Step = 1 | 2 | 3 | 4 | 5;

export default function RockBuilder(props: {
  initialRock: Rock;
  onSave: (rock: Rock) => Promise<void>;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [rock, setRock] = useState<Rock>(props.initialRock);

  const canContinue = useMemo(() => {
    if (step === 1) return rock.draft.trim().length >= 8;
    if (step === 2)
      return (
        rock.specific.trim().length >= 5 &&
        rock.measurable.trim().length >= 5 &&
        rock.achievable.trim().length >= 5 &&
        rock.relevant.trim().length >= 5 &&
        rock.timeBound.trim().length >= 5
      );
    if (step === 3) return rock.metrics.length >= 1;
    if (step === 4) return rock.milestones.length >= 3;
    return true;
  }, [step, rock]);

  const computedFinalStatement = useMemo(() => {
    const title = rock.title.trim() || "(Untitled Rock)";
    const due = rock.dueDate || "—";

    const metricsLine =
      rock.metrics.length > 0
        ? `Metrics: ${rock.metrics
            .map(
              (m) =>
                `${m.name} (Target: ${m.target}${
                  m.current ? `, Current: ${m.current}` : ""
                })`
            )
            .join("; ")}`
        : "Metrics: —";

    const milestonesLine =
      rock.milestones.length > 0
        ? `Milestones: ${rock.milestones
            .map((ms) => `${ms.text}${ms.dueDate ? ` (${ms.dueDate})` : ""}`)
            .join("; ")}`
        : "Milestones: —";

    return `${title} — Due ${due}. ${metricsLine}. ${milestonesLine}.`;
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
  }

  function addMetric() {
    const id = `m_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
    const metric: Metric = { id, name: "", target: "", current: "" };
    setRock((r) => ({ ...r, metrics: [...r.metrics, metric] }));
  }

  function updateMetric(id: string, patch: Partial<Metric>) {
    setRock((r) => ({
      ...r,
      metrics: r.metrics.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }

  function removeMetric(id: string) {
    setRock((r) => ({ ...r, metrics: r.metrics.filter((m) => m.id !== id) }));
  }

  function addMilestone() {
    const id = `ms_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
    const ms: Milestone = { id, text: "", dueDate: "", completed: false };
    setRock((r) => ({ ...r, milestones: [...r.milestones, ms] }));
  }

  function updateMilestone(id: string, patch: Partial<Milestone>) {
    setRock((r) => ({
      ...r,
      milestones: r.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }

  function removeMilestone(id: string) {
    setRock((r) => ({
      ...r,
      milestones: r.milestones.filter((m) => m.id !== id),
    }));
  }

  async function save() {
    setErr(null);
    setBusy(true);

    try {
      // Basic “leader-ready” defaults
      const title = rock.title.trim() || rock.draft.trim().slice(0, 60);
      const finalStatement = computedFinalStatement;

      // Clean up empties
      const metrics = rock.metrics
        .map((m) => ({
          ...m,
          name: (m.name || "").trim(),
          target: (m.target || "").trim(),
          current: (m.current || "").trim(),
        }))
        .filter((m) => m.name && m.target);

      const milestones = rock.milestones
        .map((m) => ({
          ...m,
          text: (m.text || "").trim(),
          dueDate: (m.dueDate || "").trim(),
          completed: !!m.completed,
        }))
        .filter((m) => m.text);

      if (metrics.length < 1) throw new Error("Please add at least 1 metric with a name and target.");
      if (milestones.length < 3) throw new Error("Please add at least 3 milestones.");

      const payload: Rock = {
        ...rock,
        title,
        finalStatement,
        metrics,
        milestones,
      };

      await props.onSave(payload);
    } catch (e: any) {
      const msg = typeof e?.message === "string" ? e.message : "Could not save Rock.";
      setErr(msg);
      setBusy(false);
      return;
    }

    setBusy(false);
  }

  return (
    <div style={shell}>
      <StepHeader step={step} onStepClick={(n) => setStep(n)} />

      {err && <Alert text={err} />}

      {step === 1 && (
        <Card title="Step 1 — Draft">
          <p style={muted}>Write your rough Rock idea in one sentence. Don’t overthink it.</p>

          <Field label="Draft Rock">
            <textarea
              value={rock.draft}
              onChange={(e) => set("draft", e.target.value)}
              placeholder="Example: Improve customer response time."
              style={{ ...input, minHeight: 90 }}
            />
          </Field>

          <Field label="Rock title (optional)">
            <input
              value={rock.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Example: Faster Customer Response"
              style={input}
            />
          </Field>

          <Field label="Due date">
            <input
              value={rock.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
              type="date"
              style={input}
            />
          </Field>
        </Card>
      )}

      {step === 2 && (
        <Card title="Step 2 — SMART coaching">
          <p style={muted}>
            Answer each one in simple words. These answers become your Rock’s backbone.
          </p>

          <Field label="Specific — What exactly will be different when this is done?">
            <textarea
              value={rock.specific}
              onChange={(e) => set("specific", e.target.value)}
              style={{ ...input, minHeight: 70 }}
              placeholder="What will be true when this Rock is complete?"
            />
          </Field>

          <Field label="Measurable — How will you prove it is complete?">
            <textarea
              value={rock.measurable}
              onChange={(e) => set("measurable", e.target.value)}
              style={{ ...input, minHeight: 70 }}
              placeholder="Numbers, counts, percentages, deadlines."
            />
          </Field>

          <Field label="Achievable — Why is this realistic this quarter?">
            <textarea
              value={rock.achievable}
              onChange={(e) => set("achievable", e.target.value)}
              style={{ ...input, minHeight: 70 }}
              placeholder="Resources, capacity, scope boundaries."
            />
          </Field>

          <Field label="Relevant — Why does this matter right now?">
            <textarea
              value={rock.relevant}
              onChange={(e) => set("relevant", e.target.value)}
              style={{ ...input, minHeight: 70 }}
              placeholder="What does it support? What problem does it solve?"
            />
          </Field>

          <Field label="Time-bound — When is it fully done?">
            <textarea
              value={rock.timeBound}
              onChange={(e) => set("timeBound", e.target.value)}
              style={{ ...input, minHeight: 70 }}
              placeholder="Example: Complete by March 31 with weekly checkpoints."
            />
          </Field>
        </Card>
      )}

      {step === 3 && (
        <Card title="Step 3 — Metrics">
          <p style={muted}>Add 1–3 measures that prove success. Keep it simple.</p>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <button type="button" onClick={addMetric} style={btnPrimary}>
              + Add Metric
            </button>
            <div style={mutedSmall}>At least 1 metric is required.</div>
          </div>

          {rock.metrics.length === 0 ? (
            <div style={empty}>No metrics yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {rock.metrics.map((m) => (
                <div key={m.id} style={rowCard}>
                  <div style={{ display: "grid", gap: 10 }}>
                    <Field label="Metric name">
                      <input
                        value={m.name}
                        onChange={(e) => updateMetric(m.id, { name: e.target.value })}
                        placeholder="Example: Average first response time"
                        style={input}
                      />
                    </Field>

                    <Field label="Target">
                      <input
                        value={m.target}
                        onChange={(e) => updateMetric(m.id, { target: e.target.value })}
                        placeholder="Example: Under 2 hours"
                        style={input}
                      />
                    </Field>

                    <Field label="Current (optional)">
                      <input
                        value={m.current ?? ""}
                        onChange={(e) => updateMetric(m.id, { current: e.target.value })}
                        placeholder="Example: 6 hours"
                        style={input}
                      />
                    </Field>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                    <button type="button" onClick={() => removeMetric(m.id)} style={btnGhost}>
                      Remove
                    </button>
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
            <button type="button" onClick={addMilestone} style={btnPrimary}>
              + Add Milestone
            </button>
            <div style={mutedSmall}>At least 3 milestones are required.</div>
          </div>

          {rock.milestones.length === 0 ? (
            <div style={empty}>No milestones yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {rock.milestones.map((m) => (
                <div key={m.id} style={rowCard}>
                  <div style={{ display: "grid", gap: 10 }}>
                    <Field label="Milestone">
                      <input
                        value={m.text}
                        onChange={(e) => updateMilestone(m.id, { text: e.target.value })}
                        placeholder="Example: Define response-time SLA and train team"
                        style={input}
                      />
                    </Field>

                    <Field label="Due date (optional)">
                      <input
                        value={m.dueDate ?? ""}
                        onChange={(e) => updateMilestone(m.id, { dueDate: e.target.value })}
                        type="date"
                        style={input}
                      />
                    </Field>

                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={!!m.completed}
                        onChange={(e) => updateMilestone(m.id, { completed: e.target.checked })}
                      />
                      <span>Completed</span>
                    </label>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                    <button type="button" onClick={() => removeMilestone(m.id)} style={btnGhost}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {step === 5 && (
        <Card title="Step 5 — Review & Save">
          <p style={muted}>Review your Rock. When ready, save it.</p>

          <div style={{ display: "grid", gap: 10 }}>
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
              <div style={reviewLabel}>Final statement</div>
              <div style={reviewText}>{computedFinalStatement}</div>
            </div>

            <div style={reviewBox}>
              <div style={reviewLabel}>Metrics</div>
              <div style={reviewText}>
                {rock.metrics.length === 0 ? (
                  "—"
                ) : (
                  <ul style={ul}>
                    {rock.metrics.map((m) => (
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
                {rock.milestones.length === 0 ? (
                  "—"
                ) : (
                  <ul style={ul}>
                    {rock.milestones.map((m) => (
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

          <div style={mutedSmall}>
            Tip: You can edit any section by clicking the step pills above.
          </div>
        </Card>
      )}

      <div style={footer}>
        <div style={{ display: "flex", gap: 10 }}>
          {props.onCancel && (
            <button type="button" onClick={props.onCancel} style={btnGhost} disabled={busy}>
              Cancel
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={back} style={btnGhost} disabled={busy || step === 1}>
            Back
          </button>

          {step < 5 ? (
            <button type="button" onClick={next} style={canContinue ? btnPrimary : btnDisabled} disabled={!canContinue || busy}>
              Continue
            </button>
          ) : (
            <button type="button" onClick={save} style={btnPrimary} disabled={busy}>
              {busy ? "Saving..." : "Save Rock"}
            </button>
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
    { n: 5, label: "Review" },
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
            <button
              key={s.n}
              type="button"
              onClick={() => props.onStepClick(s.n)}
              style={active ? pillActive : pill}
              aria-current={active ? "step" : undefined}
            >
              {s.n}. {s.label}
            </button>
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
