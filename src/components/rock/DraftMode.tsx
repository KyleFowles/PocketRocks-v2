"use client";

/* ============================================================
   FILE: src/components/rock/DraftMode.tsx

   SCOPE:
   Draft input surface ONLY.
   - Owns title + draft fields
   - No save, no continue, no navigation
   - Mobile-first spacing
   - Designed to work with StickyBottomBar

   IMPORTANT:
   This file intentionally REMOVES:
   - onSaveNow
   - onContinue
   - saving / lastSavedAt
   ============================================================ */

import React from "react";

export default function DraftMode(props: {
  title: string;
  draft: string;
  onChangeTitle: (next: string) => void;
  onChangeDraft: (next: string) => void;
}) {
  const { title, draft, onChangeTitle, onChangeDraft } = props;

  return (
    <div className="w-full px-4 pt-6 pb-32 max-w-3xl mx-auto">
      {/* Rock Title */}
      <div className="mb-4">
        <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">
          Rock Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="e.g. Hire Operations Manager"
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF7900]"
        />
      </div>

      {/* Draft Rock */}
      <div>
        <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">
          Draft Rock
        </label>
        <textarea
          value={draft}
          onChange={(e) => onChangeDraft(e.target.value)}
          placeholder="Write the outcome you want to achieve this quarter…"
          rows={6}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 resize-none focus:outline-none focus:ring-2 focus:ring-[#FF7900]"
        />
      </div>
    </div>
  );
}
