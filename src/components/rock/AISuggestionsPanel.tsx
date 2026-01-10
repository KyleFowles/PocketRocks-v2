/* ============================================================
   FILE: src/components/rock/AISuggestionsPanel.tsx

   PURPOSE:
   AI Suggestions panel for a Rock page.

   UPDATES (THIS VERSION):
   1) "Suggested statements" are now EDITABLE (each suggestion is a textarea).
   2) Regenerate suggestions WITHOUT losing edits:
      - Before regen, we save your current edited suggestions into "Saved drafts"
      - You can restore any draft back into the editor
   3) Apply uses the CURRENT edited text (not the original).

   NOTE:
   - Expects an API route at POST /api/rock-suggest that returns:
       {
         suggestedStatements?: string[],
         improvements?: string[],
         smartNotes?: string[],
         raw?: string
       }
   - Parent should pass the current Rock fields + an onApply callback.
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type RockStatus = "On Track" | "At Risk" | "Off Track" | string;

type SuggestResponse = {
  suggestedStatements?: string[];
  improvements?: string[];
  smartNotes?: string[];
  raw?: string;
};

type SuggestionRow = {
  id: string;
  text: string;
  isRecommended?: boolean;
};

type DraftSnapshot = {
  id: string;
  label: string;
  createdAt: Date;
  suggestions: { text: string }[]; // keep it simple + stable
};

export default function AISuggestionsPanel(props: {
  // Required inputs for generating suggestions
  title: string;
  status: RockStatus;
  dueDate: string;
  finalStatement: string;

  // Called when user wants to apply a statement to the Rock page
  onApply: (text: string) => void;

  // Optional UI controls
  topN?: number; // default 3
  className?: string;

  // Optional: allow parent to auto-run
  autoGenerateOnMount?: boolean;
}) {
  const topN = props.topN ?? 3;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Suggestions (editable)
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);

  // Extra output
  const [improvements, setImprovements] = useState<string[]>([]);
  const [smartNotes, setSmartNotes] = useState<string[]>([]);
  const [raw, setRaw] = useState<string>("");

  // Drafts (preserve edits on regenerate)
  const [drafts, setDrafts] = useState<DraftSnapshot[]>([]);

  // To avoid auto-running twice in dev strict mode
  const didAutoRunRef = useRef(false);

  const headerTime = useMemo(() => {
    if (!updatedAt) return "";
    return updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [updatedAt]);

  function uid() {
    // Stable-enough unique ID without extra deps
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = globalThis.crypto;
    if (c?.randomUUID) return c.randomUUID();
    return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }

  function setFromResponse(json: SuggestResponse) {
    const list = (json.suggestedStatements ?? []).slice(0, topN);

    const rows: SuggestionRow[] = list.map((t, idx) => ({
      id: uid(),
      text: String(t ?? "").trim(),
      isRecommended: idx === 0,
    }));

    setSuggestions(rows);
    setImprovements((json.improvements ?? []).map((x) => String(x)));
    setSmartNotes((json.smartNotes ?? []).map((x) => String(x)));
    setRaw(String(json.raw ?? ""));
    setUpdatedAt(new Date());
  }

  function snapshotEdits(label: string) {
    if (!suggestions.length) return;

    const snapshot: DraftSnapshot = {
      id: uid(),
      label,
      createdAt: new Date(),
      suggestions: suggestions.map((s) => ({ text: s.text })),
    };

    setDrafts((prev) => [snapshot, ...prev].slice(0, 10)); // keep last 10
  }

  async function fetchSuggestions() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rock-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: props.title ?? "",
          status: props.status ?? "",
          dueDate: props.dueDate ?? "",
          finalStatement: props.finalStatement ?? "",
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Request failed (${res.status})`);
      }

      const json = (await res.json()) as SuggestResponse;
      setFromResponse(json);
    } catch (e: any) {
      setError(e?.message || "Failed to get suggestions.");
    } finally {
      setLoading(false);
    }
  }

  async function regenerate() {
    // Save current edits before overwriting
    snapshotEdits("Saved draft (before regenerate)");
    await fetchSuggestions();
  }

  function applyText(text: string) {
    const cleaned = (text ?? "").trim();
    if (!cleaned) return;
    props.onApply(cleaned);
  }

  function restoreDraft(d: DraftSnapshot) {
    const rows: SuggestionRow[] = (d.suggestions ?? []).slice(0, topN).map((s, idx) => ({
      id: uid(),
      text: String(s.text ?? ""),
      isRecommended: idx === 0,
    }));
    setSuggestions(rows);
    setUpdatedAt(new Date());
  }

  useEffect(() => {
    if (!props.autoGenerateOnMount) return;
    if (didAutoRunRef.current) return;
    didAutoRunRef.current = true;
    void fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={[
        "rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur",
        props.className ?? "",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-baseline gap-3">
            <div className="text-xl font-extrabold tracking-tight">AI Suggestions</div>
            <div className="text-xs text-white/50">{updatedAt ? `Updated ${headerTime}` : ""}</div>
          </div>
          <div className="mt-1 text-sm text-white/65">
            Get sharper, measurable Rock statements and SMART tightening.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void regenerate()}
            disabled={loading}
            className={[
              "rounded-2xl border border-white/10 px-4 py-2 text-sm font-extrabold",
              "bg-[#FF7900]/20 hover:bg-[#FF7900]/26",
              "focus:outline-none focus:ring-2 focus:ring-[#FF7900]/45",
              loading ? "opacity-60" : "",
            ].join(" ")}
          >
            {loading ? "Working…" : suggestions.length ? "Regenerate" : "Get suggestions"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm">
          <span className="font-extrabold">Error:</span> {error}
        </div>
      )}

      {/* Suggested Statements */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-extrabold text-white/80">Suggested statements</div>
          <div className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-extrabold text-white/70">
            Top {topN}
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {suggestions.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
              Click <b className="text-white">Get suggestions</b> to generate editable statements.
            </div>
          ) : (
            suggestions.map((s) => (
              <div
                key={s.id}
                className={[
                  "rounded-2xl border bg-white/[0.03] p-4",
                  s.isRecommended ? "border-white/20" : "border-white/10",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {s.isRecommended && (
                      <div className="rounded-full border border-[#FF7900]/30 bg-[#FF7900]/15 px-3 py-1 text-xs font-extrabold text-[#FFB27A]">
                        Recommended
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => applyText(s.text)}
                    className="rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-xs font-extrabold hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-[#FF7900]/35"
                  >
                    Apply
                  </button>
                </div>

                {/* Editable textarea */}
                <textarea
                  value={s.text}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSuggestions((prev) =>
                      prev.map((x) => (x.id === s.id ? { ...x, text: v } : x))
                    );
                  }}
                  rows={3}
                  className={[
                    "mt-3 w-full resize-y rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white/90",
                    "outline-none focus:border-white/20 focus:ring-2 focus:ring-[#FF7900]/25",
                  ].join(" ")}
                />

                <div className="mt-2 text-xs text-white/45">
                  Tip: Edit this statement first, then click <b className="text-white/70">Apply</b>.
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Saved Drafts */}
      {drafts.length > 0 && (
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="text-sm font-extrabold text-white/80">Saved drafts</div>
          <div className="mt-1 text-xs text-white/55">
            These were saved automatically before regenerating, so edits are never lost.
          </div>

          <div className="mt-4 grid gap-3">
            {drafts.map((d) => (
              <div key={d.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-extrabold text-white/85">{d.label}</div>
                    <div className="mt-1 text-xs text-white/50">
                      {d.createdAt.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => restoreDraft(d)}
                      className="rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-xs font-extrabold hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-[#FF7900]/35"
                    >
                      Restore to editor
                    </button>

                    <button
                      type="button"
                      onClick={() => applyText((d.suggestions?.[0]?.text ?? "").trim())}
                      className="rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-xs font-extrabold hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-[#FF7900]/35"
                      title="Applies the first statement in this draft"
                    >
                      Apply first
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-2">
                  {d.suggestions.slice(0, topN).map((s, idx) => (
                    <div
                      key={`${d.id}_${idx}`}
                      className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/75"
                    >
                      {s.text}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements + SMART Notes */}
      {(improvements.length > 0 || smartNotes.length > 0) && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {improvements.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-extrabold text-white/80">Improvements</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                {improvements.slice(0, 6).map((x, i) => (
                  <li key={i} className="list-disc pl-5">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {smartNotes.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-extrabold text-white/80">SMART tightening</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                {smartNotes.slice(0, 6).map((x, i) => (
                  <li key={i} className="list-disc pl-5">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Raw output */}
      {raw && (
        <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-5">
          <div className="text-sm font-extrabold text-white/70">Raw output</div>
          <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/70">
            {raw}
          </pre>
        </div>
      )}
    </div>
  );
}
