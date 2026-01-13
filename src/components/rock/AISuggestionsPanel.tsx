"use client";

// FILE: src/components/rock/AISuggestionsPanel.tsx

import React, { useMemo, useState } from "react";
import type { Rock } from "@/types/rock";
import { Button } from "@/components/Button";

type AiSuggestion = {
  id: string;
  text: string;
  recommended?: boolean;
};

function uid(): string {
  return `ai_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function safeTrim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore JSON parse errors
  }

  if (!res.ok) {
    const message =
      typeof (data as { error?: unknown })?.error === "string"
        ? (data as { error: string }).error
        : safeTrim(text) || `Request failed (${res.status})`;

    throw new Error(message);
  }

  return data as TResponse;
}

export default function AISuggestionsPanel(props: {
  rock: Rock;
  onApply: (finalStatement: string) => void;
}) {
  const { rock, onApply } = props;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const canGenerate = useMemo(() => {
    return safeTrim((rock as any)?.draft).length >= 8 || safeTrim((rock as any)?.finalStatement).length >= 8;
  }, [rock]);

  async function generate() {
    setError(null);
    setAppliedId(null);
    setBusy(true);

    try {
      const data = await postJson<{ suggestions?: unknown[] }>("/api/rock-suggest", {
        rock,
        context: { mode: "suggestions", requested: 5 },
      });

      const raw = Array.isArray(data?.suggestions) ? data.suggestions : [];

      const items: AiSuggestion[] = raw
        .map((s, i) => ({
          id: uid(),
          text: safeTrim(s),
          recommended: i === 0,
        }))
        .filter((s) => s.text.length > 0);

      // ✅ TS-safe recommended enforcement
      if (items.length > 0 && !items.some((s) => s.recommended)) {
        const first = items.at(0);
        if (first) first.recommended = true;
      }

      setSuggestions(items);

      if (items.length === 0) {
        setError("No suggestions returned. Try refining your draft and try again.");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to generate suggestions.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  function applySuggestion(s: AiSuggestion) {
    setAppliedId(s.id);
    onApply(s.text);
  }

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold text-white">AI Suggestions</div>
          <div className="text-xs text-slate-300">Generate concise, outcome-based Rock statements.</div>
        </div>

        <Button
          type="button"
          onClick={generate}
          disabled={busy || !canGenerate}
          className="rounded-xl px-4 py-2 text-sm font-extrabold text-black disabled:opacity-50"
        >
          {busy ? "Generating…" : suggestions.length ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-white">
          {error}
        </div>
      )}

      {suggestions.length === 0 && !busy && !error && (
        <div className="rounded-xl border border-dashed border-white/20 p-4 text-sm text-slate-300">
          Click <strong>Generate</strong> to get AI-assisted Rock statements.
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="grid gap-3">
          {suggestions.map((s) => {
            const applied = appliedId === s.id;

            return (
              <div key={s.id} className="rounded-xl border border-white/15 bg-black/40 p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {s.recommended && (
                    <span className="rounded-full border border-orange-400/50 bg-orange-400/20 px-2 py-1 text-xs font-bold text-white">
                      Recommended
                    </span>
                  )}
                  {applied && (
                    <span className="rounded-full border border-green-400/50 bg-green-400/20 px-2 py-1 text-xs font-bold text-white">
                      Applied ✓
                    </span>
                  )}
                </div>

                <div className="mb-3 text-sm text-white">{s.text}</div>

                <div className="flex justify-end">
                  <Button type="button" onClick={() => applySuggestion(s)} className="rounded-xl px-3 py-1.5 text-xs font-extrabold text-black">
                    Apply
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
