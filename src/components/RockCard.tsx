"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";

type RockLike = {
  id: string;
  title?: string;
  status?: string;
  dueDate?: string;
  finalStatement?: string;
  updatedAt?: any;
  archived?: boolean;
};

function fmtDate(v: any) {
  try {
    if (!v) return "";
    if (v?.toDate) return v.toDate().toLocaleDateString();
    if (v instanceof Date) return v.toLocaleDateString();
    if (typeof v === "string") return new Date(v).toLocaleDateString();
  } catch {}
  return "";
}

function statusPill(status?: string) {
  const s = (status || "").toLowerCase();

  if (s.includes("complete")) return "border-emerald-500/25 bg-emerald-500/10 text-emerald-100";
  if (s.includes("off")) return "border-red-500/25 bg-red-500/10 text-red-100";
  if (s.includes("risk")) return "border-amber-500/25 bg-amber-500/10 text-amber-100";
  if (s.includes("on")) return "border-sky-500/25 bg-sky-500/10 text-sky-100";

  return "border-white/10 bg-white/5 text-slate-200";
}

export default function RockCard(props: { rock: RockLike }) {
  const router = useRouter();
  const rock = props.rock;

  const title = rock.title?.trim() || "Untitled Rock";
  const status = rock.status || "Draft";
  const due = rock.dueDate ? String(rock.dueDate) : "";
  const updated = fmtDate(rock.updatedAt);

  const subtitle = useMemo(() => {
    const parts: string[] = [];
    if (due) parts.push(`Due: ${due}`);
    if (updated) parts.push(`Updated: ${updated}`);
    return parts.join(" • ");
  }, [due, updated]);

  return (
    <button
      type="button"
      onClick={() => router.push(`/rocks/${rock.id}`)}
      className={[
        "w-full text-left rounded-2xl border border-white/10 bg-white/4 p-5",
        "transition hover:bg-white/7",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-slate-100">{title}</div>

          {rock.finalStatement?.trim() ? (
            <div className="mt-2 line-clamp-2 text-sm text-slate-300">
              {rock.finalStatement}
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-500">
              No final Rock statement yet.
            </div>
          )}

          {subtitle ? (
            <div className="mt-3 text-xs text-slate-500">{subtitle}</div>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={[
              "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
              statusPill(status),
            ].join(" ")}
          >
            {status}
          </span>

          <span className="text-xs text-slate-400">Open →</span>
        </div>
      </div>
    </button>
  );
}
