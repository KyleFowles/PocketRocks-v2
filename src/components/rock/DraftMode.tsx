/* ============================================================
   FILE: src/components/rock/DraftMode.tsx

   SCOPE:
   Draft Mode = mobile-first data entry (Responsive).
   - Draft input dominates viewport
   - Optional details stay hidden until typing starts
   - Sticky bottom progress + single primary action

   CLARITY UPDATE (REMOVES "SMOKE"):
   - Increase surface contrast (less transparent haze)
   - Add a subtle spotlight behind the form (aligned to mineral teal palette)
   - Use crisp borders and stronger card separation

   BUTTON SYSTEM:
   - Uses shared <Button> component with mineral teal primary
   - Removes hard-coded Tailwind orange focus rings and orange spotlight

   UX CONTRACT:
   - One job: type the draft
   - One primary action: Continue
   ============================================================ */

"use client";

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
    <div className="relative mx-auto w-full max-w-xl px-4 pb-32 pt-6">
      {/* Spotlight behind the form (clarity, not haze) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[560px] max-w-[90vw] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(20,184,166,0.16), rgba(20,34,51,0.0))",
          filter: "blur(18px)",
          opacity: 1,
        }}
      />

      <div className="relative">
        <div className="mb-3 text-xs text-white/55">{saveHint}</div>

        {/* Crisp card surface (less transparency, more contrast) */}
        <div className="rounded-2xl border border-white/12 bg-[#0b1628]/88 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.55)] md:p-5">
          <div className="mb-2 text-xs text-white/70">Draft Rock (one sentence)</div>

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
              focus:ring-2 focus:ring-teal-300/40
            "
          />

          {canShowDetails ? (
            <div className="mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDetails((s) => !s)}
                className="w-full justify-start px-0 py-0 text-sm font-semibold text-white/70 hover:text-white sm:w-auto"
              >
                {showDetails ? "Hide details" : "Add details (optional)"}
              </Button>

              {showDetails ? (
                <div className="mt-3">
                  <label className="mb-2 block text-xs text-white/70">Rock title (optional)</label>
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
                      focus:ring-2 focus:ring-teal-300/40
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
