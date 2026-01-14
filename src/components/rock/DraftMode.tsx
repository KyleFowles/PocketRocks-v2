/* ============================================================
   FILE: src/components/rock/DraftMode.tsx

   SCOPE:
   Draft Mode UI for Rock editing.
   - Accepts and renders `title` + `onChangeTitle` (fixes TS build error)
   - Keeps draft statement editing
   - Shows save status + supports Save Now + Continue actions
   - Designed to work with StickyBottomBar + shared Button

   NOTES:
   - This change fixes:
     src/app/rocks/[rockId]/page.tsx passing `title={...}` which previously
     did not exist on DraftModeProps.
   ============================================================ */

"use client";

import React, { useMemo } from "react";
import StickyBottomBar from "@/components/rock/StickyBottomBar";
import { Button } from "@/components/Button";

export type DraftModeProps = {
  // Core content
  title: string;
  draft: string;

  // Save state
  saving: boolean;
  lastSavedAt: number | null;

  // Handlers
  onChangeTitle: (next: string) => void;
  onChangeDraft: (next: string) => void;

  // Actions
  onSaveNow: () => Promise<void>;
  onContinue: () => Promise<void>;

  // Optional UI helpers
  hint?: string;
};

function formatLastSaved(ts: number | null) {
  if (!ts) return "Not saved yet";
  try {
    const d = new Date(ts);
    return `Saved ${d.toLocaleString()}`;
  } catch {
    return "Saved";
  }
}

export default function DraftMode(props: DraftModeProps) {
  const {
    title,
    draft,
    saving,
    lastSavedAt,
    onChangeTitle,
    onChangeDraft,
    onSaveNow,
    onContinue,
    hint,
  } = props;

  const statusText = useMemo(() => {
    if (saving) return "Saving…";
    return formatLastSaved(lastSavedAt);
  }, [saving, lastSavedAt]);

  const canContinue = useMemo(() => {
    const t = (title ?? "").trim();
    const d = (draft ?? "").trim();
    // Allow continue if either has meaningful content
    return t.length > 0 || d.length > 0;
  }, [title, draft]);

  return (
    <div className="min-h-[calc(100vh-72px)] pb-24">
      <div className="mx-auto w-full max-w-3xl px-5 pt-8">
        <div className="mb-6">
          <div className="text-sm tracking-[0.25em] text-white/60">DRAFT</div>
          <h1 className="mt-2 text-3xl font-semibold text-white">Start your Rock</h1>
          <p className="mt-2 text-white/70">
            Capture the goal in plain language. You can refine it later.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">Title</label>
            <input
              value={title ?? ""}
              onChange={(e) => onChangeTitle(e.target.value)}
              placeholder="e.g., Improve customer response time"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/10"
            />
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">Draft Rock statement</label>
            <textarea
              value={draft ?? ""}
              onChange={(e) => onChangeDraft(e.target.value)}
              placeholder="Write a clear, outcome-based statement…"
              rows={6}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/10"
            />
            <div className="mt-1 flex items-center justify-between gap-3 text-sm">
              <div className="text-white/60">{hint ?? "Tip: Keep it measurable and time-bound."}</div>
              <div className="text-white/55">{statusText}</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onSaveNow()}
              disabled={saving}
            >
              Save now
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={() => onContinue()}
              disabled={saving || !canContinue}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>

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
