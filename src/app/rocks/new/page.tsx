"use client";

/* ============================================================
   FILE: src/components/rock/DraftMode.tsx

   SCOPE:
   Draft entry surface ONLY.
   - Owns title + draft text
   - Does NOT own navigation actions
   - Mobile-first spacing

   UX RULE:
   DraftMode never controls flow progression.
   ============================================================ */

import React from "react";

export default function DraftMode(props: {
  title: string;
  draft: string;
  onChangeTitle: (v: string) => void;
  onChangeDraft: (v: string) => void;
}) {
  const { title, draft, onChangeTitle, onChangeDraft } = props;

  return (
    <div className="w-full px-4 pt-6 pb-32 max-w-3xl mx-auto">
      {/* Title */}
      <div className="mb-4">
        <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">
          Rock title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="e.g. Hire Operations Manager"
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#FF7900]"
        />
      </div>

      {/* Draft */}
      <div>
        <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">
          Draft Rock
        </label>
        <textarea
          value={draft}
          onChange={(e) => onChangeDraft(e.target.value)}
          placeholder="Write the outcome you want to achieve this quarter…"
          rows={6}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 resize-none focus:outline-none focus:ring-1 focus:ring-[#FF7900]"
        />
      </div>
    </div>
  );
}
