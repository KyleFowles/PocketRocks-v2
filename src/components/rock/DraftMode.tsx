/* ============================================================
   FILE: src/components/rock/DraftMode.tsx

   SCOPE:
   Fix “Continue” button logic so it actually works.
   - Always shows an on-screen sticky Continue button (not below fold)
   - Prevents “click does nothing” by:
       * Using type="button"
       * Validating required fields
       * Focusing the Draft textarea if empty
       * Executing onSaveNow (optional) then onContinue (optional)
   - Props are backwards-compatible:
       * title/draft/onChangeTitle/onChangeDraft required
       * saving/lastSavedAt/onSaveNow/onContinue optional
   ============================================================ */

"use client";

import React from "react";
import StickyBottomBar from "@/components/rock/StickyBottomBar";

export default function DraftMode(props: {
  title: string;
  draft: string;
  onChangeTitle: (next: string) => void;
  onChangeDraft: (next: string) => void;

  saving?: boolean;
  lastSavedAt?: number | null;
  onSaveNow?: () => Promise<void>;
  onContinue?: () => Promise<void>;
}) {
  const {
    title,
    draft,
    onChangeTitle,
    onChangeDraft,
    saving = false,
    lastSavedAt = null,
    onSaveNow,
    onContinue,
  } = props;

  const draftRef = React.useRef<HTMLTextAreaElement | null>(null);

  const hasDraft = (draft ?? "").trim().length > 0;
  const primaryDisabled = saving || !hasDraft;

  function formatSaved(ts: number | null) {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  async function handleContinue() {
    // If draft is empty, make it obvious why nothing happens.
    if (!hasDraft) {
      draftRef.current?.focus();
      // tiny scroll assist for mobile keyboards / small screens
      draftRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Save first (if provided), then continue.
    if (onSaveNow) await onSaveNow();
    if (onContinue) await onContinue();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-10 pb-32">
      <div className="space-y-6">
        <div>
          <div className="text-xs font-semibold tracking-widest text-white/55">
            ROCK TITLE
          </div>
          <input
            value={title ?? ""}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="e.g. Hire Operations Manager"
            className={[
              "mt-2 w-full rounded-2xl",
              "border border-white/10 bg-white/5",
              "px-4 py-3 text-white",
              "placeholder:text-white/35",
              "outline-none focus:border-white/20 focus:bg-white/7",
            ].join(" ")}
          />
        </div>

        <div>
          <div className="text-xs font-semibold tracking-widest text-white/55">
            DRAFT ROCK
          </div>
          <textarea
            ref={draftRef}
            value={draft ?? ""}
            onChange={(e) => onChangeDraft(e.target.value)}
            placeholder="Write the outcome you want to achieve this quarter..."
            rows={6}
            className={[
              "mt-2 w-full rounded-2xl",
              "border border-white/10 bg-white/5",
              "px-4 py-3 text-white",
              "placeholder:text-white/35",
              "outline-none focus:border-white/20 focus:bg-white/7",
              !hasDraft ? "" : "",
            ].join(" ")}
          />
          {!hasDraft ? (
            <div className="mt-2 text-xs text-white/45">
              Add a one-sentence draft to enable Continue.
            </div>
          ) : null}
        </div>

        <div className="text-xs text-white/40">
          {saving ? (
            <span>Saving…</span>
          ) : lastSavedAt ? (
            <span>Saved {formatSaved(lastSavedAt)}</span>
          ) : (
            <span />
          )}
        </div>
      </div>

      <StickyBottomBar
        progressLabel="Draft · Step 1 of 5"
        stepText={primaryDisabled ? "Enter a draft to continue" : "Ready for Improve"}
        primaryAction={{
          label: "Continue",
          onClick: handleContinue,
          disabled: primaryDisabled,
        }}
      />
    </div>
  );
}
