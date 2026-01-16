/* ============================================================
   FILE: src/components/rockBuilder/utils.ts

   SCOPE:
   Pure helpers used by RockBuilder.
   - Safe string handling
   - Step clamping
   - Deep undefined stripping (Firestore safety)
   - Dev-only logging
   - Stable-ish stringify for dedupe
   ============================================================ */

import type { Step } from "./types";

export function safeStr(v: any): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return "";
  try {
    return String(v);
  } catch {
    return "";
  }
}

export function safeTrim(v: any): string {
  return safeStr(v).trim();
}

export function clampStep(v: any): Step {
  const n = typeof v === "number" ? v : Number(v);
  if (n === 2) return 2;
  if (n === 3) return 3;
  if (n === 4) return 4;
  if (n === 5) return 5;
  return 1;
}

export function stripUndefinedDeep(input: any): any {
  if (input === undefined) return undefined;
  if (Array.isArray(input)) return input.map(stripUndefinedDeep).filter((x) => x !== undefined);
  if (input && typeof input === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(input)) {
      const cleaned = stripUndefinedDeep(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  return input;
}

export function devError(...args: any[]) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
}

export function stableStringify(obj: any) {
  try {
    return JSON.stringify(obj, Object.keys(obj || {}).sort());
  } catch {
    return "";
  }
}
