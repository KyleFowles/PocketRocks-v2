/* ============================================================
   FILE: components/rock/DraftMode.tsx

   PURPOSE:
   Draft Mode = data entry first.
   - Collapsed header (handled by parent page)
   - Hero input occupies the viewport
   - Secondary fields are deferred behind "Add details (optional)"
   - Sticky bottom progress + single primary action

   CONTRACT:
   - One job: type the draft
   - No stepper in content
   - One primary action: Continue
   ============================================================ */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import StickyBottomBar from "@/components/rock/StickyBottomBar";

export default function DraftMode(props: {
  draft: string;
  title: string;

  // autosave hooks (optional)
  saving?: boolean;
  lastSavedAt?: number | null;

  onChangeDraft: (next: string) => void;
  onChangeTitle: (next: string) => void;

  onSaveNow: () => Promise<void>;
  onContinue: () => Promise<void>;
}) {
  const {
    draft,
    title,
    saving = false,
    lastSavedAt = null,
    onChangeDraft,
    onChangeTitle,
    onSaveNow,
    onContinue,
  } = props;

  const [localDraft, setLocalDraft] = useState(draft ?? "");
  const [localTitle, setLocalTitle] = useState(title ?? "");
  const [showDetails, setShowDetails] = useState(false);

  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lastPushRef = useRef<number>(0);

  useEffect(() => setLocalDraft(draft ?? ""), [draft]);
  useEffect(() => setLocalTitle(title ?? ""), [title]);

  // Light debounce to keep parent state in sync
  useEffect(() => {
    const t = window.setTimeout(() => {
      const now = Date.now();
      if (now - lastPushRef.current < 200) return;
      lastPushRef.current = now;

      onChangeDraft(localDraft);
      onChangeTitle(localTitle);
    }, 120);

    return () => window.clearTimeout(t);
  }, [localDraft, localTitle, onChangeDraft, onChangeTitle]);

  const saveHint = useMemo(() => {
    if (saveErr) return saveErr;
    if (saving) return "Saving…";
    if (!lastSavedAt) return "";
    const d = new Date(lastSavedAt);
    return `Saved ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }, [saving, lastSavedAt, saveErr]);

  const canContinue = useMemo(() => localDraft.trim().length > 0, [localDraft]);

  async function handleBlurSave() {
    // Keep it quiet. No save button needed.
    if (!localDraft.trim() && !localTitle.trim()) return;
    try {
      setSaveErr(null);
      await onSaveNow();
    } catch {
      setSaveErr("Could not save. Check connection.");
    }
  }

  async function handleContinue() {
    if (!canContinue) return;
    setBusy(true);
    try {
      setSaveErr(null);
      await onSaveNow();
      await onContinue();
    } catch {
      setSaveErr("Could not continue. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pt-4 pb-28">
      {/* Save hint (quiet, single line) */}
      <div className="text-xs text-white/50 mb-3">{saveHint}</div>

      {/* HERO INPUT: this should be visible immediately on mobile */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs text-white/60 mb-2">Draft Rock (one sentence)</div>
        <textarea
          value={localDraft}
          onChange={(e) => setLocalDraft(e.target.value)}
          onBlur={handleBlurSave}
          placeholder="Example: Improve customer response time."
          className="w-full min-h-[42vh] md:min-h-[260px] rounded-2xl bg-black/20 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#FF7900]/60"
        />

        {/* Deferred details */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="text-sm text-white/65 hover:text-white transition"
          >
            {showDetails ? "Hide details" : "Add details (optional)"}
          </button>

          {showDetails ? (
            <div className="mt-3">
              <label className="block text-xs text-white/60 mb-2">Rock title (optional)</label>
              <input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleBlurSave}
                placeholder="Example: Faster Customer Response"
                className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#FF7900]/60"
              />
            </div>
          ) : null}
        </div>
      </div>

      <StickyBottomBar
        progressLabel="Draft · Step 1 of 5"
        primaryAction={{
          label: "Continue",
          onClick: handleContinue,
          disabled: busy || !canContinue,
        }}
      />
    </div>
  );
}
