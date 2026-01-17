/* ============================================================
   FILE: src/components/rockBuilder/finalAssembler.ts

   SCOPE:
   Final Rock Assembler + Assembly Key
   - FIX: Export `getFinalAssemblyKey` (RockBuilder imports it)
   - Provides stable "fingerprint" so Step 5 can safely auto-assemble
   - Keeps assembly conservative: prefers existing explicit finalStatement,
     otherwise builds from SMART → suggestedImprovement → draft → title
   ============================================================ */

import { safeStr, safeTrim, stableStringify } from "./utils";

/**
 * Build a stable key from the parts that should trigger a re-assembly.
 * This is used to avoid overwriting a user-edited final statement unless
 * the final statement was auto-assembled from the same inputs.
 */
export function getFinalAssemblyKey(rock: any): string {
  const payload = {
    title: safeTrim(rock?.title),
    draft: safeTrim(rock?.draft),
    suggestedImprovement: safeTrim(rock?.suggestedImprovement),
    smart: {
      specific: safeTrim(rock?.smart?.specific),
      measurable: safeTrim(rock?.smart?.measurable),
      achievable: safeTrim(rock?.smart?.achievable),
      relevant: safeTrim(rock?.smart?.relevant),
      timebound: safeTrim(rock?.smart?.timebound),
    },
    metricsText: safeTrim(rock?.metricsText),
    milestonesText: safeTrim(rock?.milestonesText),
  };

  return stableStringify(payload);
}

/**
 * Assemble a final statement using a consistent priority order.
 * This should be "good enough" and predictable — not overly clever.
 */
export function assembleFinalRock(rock: any): string {
  const existingFinal = safeTrim(rock?.finalStatement);
  if (existingFinal) return existingFinal;

  const specific = safeTrim(rock?.smart?.specific);
  const measurable = safeTrim(rock?.smart?.measurable);
  const timebound = safeTrim(rock?.smart?.timebound);

  const base =
    specific ||
    safeTrim(rock?.suggestedImprovement) ||
    safeTrim(rock?.draft) ||
    safeTrim(rock?.title) ||
    "Rock";

  const metric = measurable ? ` (${measurable})` : "";
  const due = timebound ? ` — Due ${timebound}` : "";

  return safeStr(`${base}${metric}${due}`.trim());
}
