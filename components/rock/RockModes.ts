/* ============================================================
   FILE: components/rock/RockModes.ts

   PURPOSE:
   Central types + helpers for the Draft / Improve mode flow.

   POCKETROCKS UX CONTRACT ENFORCEMENT:
   - One job per mode
   - One primary action
   - Progressive disclosure (AI only in Improve)
   ============================================================ */

export type RockMode = "draft" | "improve";

export type ImproveSuggestion = {
  id: string;
  text: string;
  recommended?: boolean;
};

export function normalizeSuggestionText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim();
}

export function makeSuggestionId(seed: string): string {
  // small stable-ish id without pulling in a UUID lib
  const base = seed.trim().slice(0, 48);
  const hash = Array.from(base).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return `s_${hash.toString(16)}`;
}
