/* ============================================================
   FILE: src/components/rock/RockModes.ts

   SCOPE:
   Shared Rock flow types + helpers used across:
   - /rocks/[rockId]/page.tsx
   - Draft / Improve UI

   PURPOSE:
   Fix build error by providing the module that the Rock detail
   page expects:
   - RockMode type
   - ImproveSuggestion type
   - makeSuggestionId()
   - normalizeSuggestionText()

   NOTES:
   - No React here (pure helpers)
   - Safe for client/server usage
   ============================================================ */

export type RockMode = "draft" | "improve";

export type ImproveSuggestion = {
  id: string;
  text: string;
  recommended?: boolean;
};

/**
 * Generate a stable-ish unique id without adding dependencies.
 */
export function makeSuggestionId(prefix: string = "s"): string {
  try {
    // Works in modern browsers + many runtimes
    // (Some server runtimes may not support randomUUID, so we fall back)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = globalThis as any;
    if (c?.crypto?.randomUUID) return `${prefix}_${c.crypto.randomUUID()}`;
  } catch {
    // ignore
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * Normalize suggestion text from various API formats:
 * - trims
 * - removes surrounding quotes
 * - collapses excessive whitespace
 * - strips common bullet prefixes
 */
export function normalizeSuggestionText(input: unknown): string {
  if (typeof input !== "string") return "";

  let s = input.trim();

  // Remove wrapping quotes
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'")) ||
    (s.startsWith("“") && s.endsWith("”"))
  ) {
    s = s.slice(1, -1).trim();
  }

  // Strip leading bullets / numbering (common from LLM outputs)
  s = s.replace(/^[-*•]\s+/, "");
  s = s.replace(/^\d+\.\s+/, "");

  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();

  return s;
}
