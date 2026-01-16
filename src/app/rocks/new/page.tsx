/* ============================================================
   FILE: src/app/rocks/new/page.tsx

   SCOPE:
   Option A — Single flow doorway
   - Generates a new rockId and redirects to /rocks/[rockId]?new=1
   - The builder owns Draft UI (StepDraft)
   - Avoids Firestore read before the doc exists
   ============================================================ */

import { redirect } from "next/navigation";

function makeId() {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      // @ts-ignore
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `rock_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function NewRockPage() {
  const id = makeId();
  redirect(`/rocks/${encodeURIComponent(id)}?new=1`);
}
