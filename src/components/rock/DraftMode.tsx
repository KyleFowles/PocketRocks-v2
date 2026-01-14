/* ============================================================
   FILE: src/components/rock/DraftMode.tsx

   SCOPE:
   Draft Mode UI for Rock editing.
   - Guaranteed above-the-fold layout on laptop screens
   - No hard-coded header height assumptions
   - Footer-safe layout with explicit space reservation

   DESIGN PRINCIPLES:
   - Mobile-first
   - SaaS-grade vertical rhythm
   - Stable under future header/footer changes
   ============================================================ */

"use client";

import React, { useMemo } from "react";
import StickyBottomBar from "@/components/rock/StickyBottomBar";
import { Button } from "@/components/Button";

export type DraftModeProps = {
  title: string;
  draft: string;

  saving: boolean;
  lastSavedAt: number | null;

  onChangeTitle: (next: string) => void;
  onChangeDraft: (next: string) => void;

  onSaveNow: () => Promise<void>;
  onContinue: () => Promise<void>;

  hint?: string;
};

function formatLastSaved(ts: number | null) {
  if (!ts) return "Not saved yet";
  try {
    return `Saved ${new Date(ts).toLocaleString()}`;
  } catch {
    return "Saved";
  }
}

export default function DraftMode({
  title,
  draft,
  saving,
  lastSavedAt,
  onChangeTitle,
  onChangeDraft,
  onSaveNow,
  onContinue,
  hint,
}: DraftModeProps) {
  const statusText = useMemo(() => {
    if (saving) return "Saving…";
    return formatLastSaved(lastSavedAt);
  }, [saving, lastSavedAt]);

  const canContinue = useMemo(() => {
    const t = (title ?? "").trim();
    const d = (draft ?? "").trim();
    return t.length > 0 || d.length > 0;
  }, [title, draft]);

  return (
    <div className="relative pb-[88px]">
      <div className="mx-auto w-full max-w-3xl px-5 pt-5">
        {/* Header */}
        <div className="mb-4">
          <div className="text-xs tracking-[0.22em] text-white/60">
            DRAFT
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            Start your Rock
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Capture the goal in plain language. You can refine it later.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">
              Title
            </label>
            <input
              value={title ?? ""}
              onChange={(e) => onChangeTitle(e.target.value)}
              placeholder="e.g., Improve customer response time"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/10"
            />
          </div>

          {/* Draft */}
          <div className="mt-4 flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">
              Draft Rock statement
            </label>
            <textarea
              value={draft ?? ""}
              onChange={(e) => onChangeDraft(e.target.value)}
              placeholder="Write a clear, outcome-based statement…"
              rows={4}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/10 sm:rows-5"
            />

            <div className="mt-1 flex items-center justify-between gap-3 text-xs">
              <div className="text-white/60">
                {hint ?? "Tip: Keep it measurable and time-bound."}
              </div>
              <div className="text-white/55">
                {statusText}
              </div>
            </div>
          </div>

          {/* Inline actions (desktop assist) */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onSaveNow}
              disabled={saving}
            >
              Save now
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={onContinue}
              disabled={saving || !canContinue}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <StickyBottomBar
        progressLabel="Draft · Step 1 of 5"
        primaryAction={{
          label: "Continue",
          onClick: onContinue,
          disabled: saving || !canContinue,
        }}
        secondaryAction={{
          label: saving ? "Saving…" : "Save now",
          onClick: onSaveNow,
          disabled: saving,
        }}
        hint={hint}
      />
    </div>
  );
}
