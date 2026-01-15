/* ============================================================
   FILE: src/lib/input.ts

   SCOPE:
   Input safety helpers for forms (textarea + input)
   - Prevent controlled/uncontrolled warnings
   - Preserve spaces + newlines (do NOT auto-trim while typing)
   ============================================================ */

export function safeStr(v: any): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return "";
  try {
    return String(v);
  } catch {
    return "";
  }
}

/** Use this for validations only (not onChange) */
export function safeTrim(v: any): string {
  return safeStr(v).trim();
}
