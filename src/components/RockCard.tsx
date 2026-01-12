// FILE: src/components/RockCard.tsx
"use client";

import React from "react";
import type { Rock } from "@/types/rock";

export default function RockCard(props: {
  rock: Rock;
  onClick?: () => void;
  rightSlot?: React.ReactNode;
}) {
  const { rock } = props;

  const title = (rock.title || "").trim() || "Untitled Rock";
  const finalStatement = (rock.finalStatement || "").trim();
  const due = (rock.dueDate || "").trim();

  function handleClick() {
    if (props.onClick) props.onClick();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left shadow-sm hover:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-base font-extrabold text-white">{title}</div>
          <div className="mt-1 line-clamp-2 text-sm text-slate-300">
            {finalStatement ? finalStatement : "No final statement yet."}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-1">
              Status: {rock.status}
            </span>
            <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-1">
              Due: {due || "—"}
            </span>
          </div>
        </div>

        {props.rightSlot ? <div className="shrink-0">{props.rightSlot}</div> : null}
      </div>
    </button>
  );
}
