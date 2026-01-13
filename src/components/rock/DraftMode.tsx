"use client";

/* ============================================================
   FILE: src/components/rock/DraftMode.tsx

   SCOPE:
   Draft Mode = mobile-first data entry.
   - Draft input dominates viewport
   - Optional details stay hidden until typing starts
   - Sticky bottom progress + single primary action

   CLARITY UPDATE (REMOVES "SMOKE"):
   - Increase surface contrast (less transparent haze)
   - Add a subtle spotlight behind the form
   - Use crisp borders and stronger card separation

   UX CONTRACT:
   - One job: type the draft
   - One primary action: Continue
   ============================================================ */

import React, { useEffect, useMemo, useRef, useState } from "react";
import StickyBottomBar from "@/components/rock/StickyBottomBar";
import { Button } from "@/components/Button";

export default function DraftMode(props: {
  draft: string;
  title: string;

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

  // Push changes upstream (debounced)
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
  const canShowDetails = useMemo(() => localDraft.trim().length > 0, [localDraft]);

  async function handleBlurSave() {
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
    <div className="w-full max-w-xl mx-auto px-4 pt-6 pb-32 relative">
      {/* Spotlight behind the form (clarity, not haze) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[420px] w-[560px] max-w-[90vw] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,121,0,0.14), rgba(20,34,51,0.0))",
          filter: "blur(18px)",
          opacity: 1,
        }}
      />

      <div className="relative">
        <div className="text-xs text-white/55 mb-3">{saveHint}</div>

        {/* Crisp card surface (less transparency, more contrast) */}
        <div className="rounded-2xl border border-white/12 bg-[#0b1628]/88 shadow-[0_18px_60px_rgba(0,0,0,0.55)] p-4 md:p-5">
          <div className="text-xs text-white/70 mb-2">Draft Rock (one sentence)</div>

          <textarea
            value={localDraft}
            onChange={(e) => setLocalDraft(e.target.value)}
            onBlur={handleBlurSave}
            placeholder="Example: Improve customer response time."
            className="
              w-full
              min-h-[38vh]
              sm:min-h-[34vh]
              md:min-h-[220px]
              md:max-h-[320px]
              rounded-2xl
              bg-[#050b16]
              border border-white/12
              px-4 py-3
              text-white
              placeholder:text-white/35
              focus:outline-none
              focus:ring-2 focus:ring-[#FF7900]/75
            "
          />

          {canShowDetails ? (
            <div className="mt-4">
              <Button
                type="button"
                onClick={() => setShowDetails((s) => !s)}
                className="text-sm text-white/70 hover:text-white transition"
              >
                {showDetails ? "Hide details" : "Add details (optional)"}
              </Button>

              {showDetails ? (
                <div className="mt-3">
                  <label className="block text-xs text-white/70 mb-2">Rock title (optional)</label>
                  <input
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    onBlur={handleBlurSave}
                    placeholder="Example: Faster Customer Response"
                    className="
                      w-full rounded-xl
                      bg-[#050b16]
                      border border-white/12
                      px-4 py-3
                      text-white
                      placeholder:text-white/35
                      focus:outline-none
                      focus:ring-2 focus:ring-[#FF7900]/75
                    "
                  />
                </div>
              ) : null}
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
