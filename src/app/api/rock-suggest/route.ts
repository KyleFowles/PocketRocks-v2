/* ============================================================
   FILE: src/app/api/rock-suggest/route.ts

   SCOPE:
   Rock Suggest API — ALWAYS returns usable output (SMART skeleton fallback)
   - Supports BOTH request shapes:

     Legacy:
       { title?, draft?, finalStatement?, dueDate?, status?, count? }

     New:
       { rock: { ...RockFields }, context?: { requested?: number } }

   - Response (always):
       { ok: true, suggestions: { text: string }[], mode: "ai" | "fallback" }

   - Guarantees:
     * If AI returns nothing (or errors), returns a SMART skeleton suggestion
     * No empty suggestions array
   ============================================================ */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Suggestion = { text: string };

function safeStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return "";
  try {
    return String(v);
  } catch {
    return "";
  }
}

function safeTrim(v: unknown): string {
  return safeStr(v).trim();
}

function pickRequestedCount(body: any): number {
  const raw =
    body?.context?.requested ??
    body?.requested ??
    body?.count ??
    1;

  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(5, Math.floor(n)));
}

function extractInputs(body: any): {
  title: string;
  draft: string;
  dueDate: string;
  finalStatement: string;
} {
  // New shape
  const r = body?.rock ?? null;

  const title = safeTrim(r?.title ?? body?.title);
  const draft = safeTrim(r?.draft ?? body?.draft);
  const dueDate = safeTrim(r?.dueDate ?? body?.dueDate);
  const finalStatement = safeTrim(r?.finalStatement ?? body?.finalStatement);

  return { title, draft, dueDate, finalStatement };
}

/**
 * SMART skeleton that always gives the user a structured path forward,
 * even if AI fails or returns empty.
 */
function buildSmartSkeletonSuggestion(input: {
  title: string;
  draft: string;
  dueDate: string;
}): Suggestion {
  const title = input.title || "Rock";
  const draft = input.draft || "(add a plain-English draft statement)";
  const due = input.dueDate || "[date]";

  const text =
`SMART Skeleton (auto-generated)

Rock Title:
- ${title}

Your Draft:
- ${draft}

S — Specific (what “done” looks like):
- By ${due}, we will ________________________________.
- Scope: ____________________ (what’s included / excluded)

M — Measurable (how you’ll prove it):
- Primary metric: ____________________ (number + unit)
- Baseline today: ________   Target: ________
- Scorecard cadence: Weekly

A — Achievable (how you’ll get there):
- Owner: ____________________
- Resources/support needed: ____________________
- Key constraints/risks: ____________________

R — Relevant (why it matters):
- This supports ____________________ (company goal / revenue / capacity / quality)
- If we do nothing, the cost is ____________________

T — Time-bound (when it’s due):
- Due date: ${due}
- Weekly check-in question: “Are we on track this week? Yes/No—why?”

Suggested “Final Rock Statement” template:
- By ${due}, ____________________ will ____________________ as measured by ____________________.

Optional starter placeholders (use later steps):
- Metrics (Step 3): ____________________ ; ____________________ ; ____________________
- Milestones (Step 4): Week 2 ________ | Week 6 ________ | Week 10 ________ | Week 13 DONE`;

  return { text };
}

function normalizeSuggestions(raw: any): Suggestion[] {
  // Accept:
  // - { suggestions: [...] }
  // - [...]
  // Where each item can be string or {text}
  const arr = Array.isArray(raw?.suggestions)
    ? raw.suggestions
    : Array.isArray(raw)
      ? raw
      : [];

  const out: Suggestion[] = [];
  for (const item of arr) {
    if (typeof item === "string") {
      const t = safeTrim(item);
      if (t) out.push({ text: t });
      continue;
    }
    if (item && typeof item === "object") {
      const t = safeTrim((item as any).text);
      if (t) out.push({ text: t });
    }
  }
  return out;
}

/**
 * Best-effort AI call.
 * - Uses dynamic import so builds won't fail if the "openai" package isn't installed.
 * - If anything goes wrong, caller will fallback.
 */
async function getAiSuggestions(params: {
  title: string;
  draft: string;
  dueDate: string;
  requested: number;
}): Promise<Suggestion[]> {
  const apiKey = safeTrim(process.env.OPENAI_API_KEY);
  if (!apiKey) return [];

  let OpenAI: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    OpenAI = (await import("openai")).default;
  } catch {
    return [];
  }

  const client = new OpenAI({ apiKey });

  const { title, draft, dueDate, requested } = params;

  const userInput = {
    title: title || "",
    draft: draft || "",
    dueDate: dueDate || "",
    requested,
  };

  const system =
`You are PocketRocks. Your job is to take vague EOS "Rock" inputs and return best-of-breed improvements.

Requirements:
- ALWAYS return JSON only (no markdown).
- Output must be: { "suggestions": [ { "text": "..." }, ... ] }
- Each "text" MUST include a SMART skeleton filled in as much as possible.
- If details are missing, use clear placeholders like [metric], [date], [owner], etc.
- Keep it concise, actionable, and friendly.`;

  const prompt =
`Create ${requested} improved suggestions.

Input:
${JSON.stringify(userInput)}

Return JSON only.`;

  // Pick a reasonable default model. If unavailable, the call will fail and we’ll fallback.
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const resp = await client.chat.completions.create({
    model,
    temperature: 0.4,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
  });

  const content = safeTrim(resp?.choices?.[0]?.message?.content);
  if (!content) return [];

  // Try JSON parse first
  try {
    const parsed = JSON.parse(content);
    return normalizeSuggestions(parsed);
  } catch {
    // If the model returned plain text, treat it as a single suggestion.
    return normalizeSuggestions([{ text: content }]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title, draft, dueDate } = extractInputs(body);
    const requested = pickRequestedCount(body);

    // 1) Try AI first
    const ai = await getAiSuggestions({ title, draft, dueDate, requested });

    if (ai.length > 0) {
      return NextResponse.json({ ok: true, mode: "ai", suggestions: ai.slice(0, requested) });
    }

    // 2) Guaranteed fallback (SMART skeleton)
    const fallback = buildSmartSkeletonSuggestion({ title, draft, dueDate });

    return NextResponse.json({
      ok: true,
      mode: "fallback",
      suggestions: [fallback],
    });
  } catch (e: any) {
    // Even on unexpected server errors, still return a usable skeleton.
    const fallback = buildSmartSkeletonSuggestion({ title: "", draft: "", dueDate: "" });

    return NextResponse.json(
      {
        ok: true,
        mode: "fallback",
        suggestions: [fallback],
        error: safeTrim(e?.message) || "Unknown error",
      },
      { status: 200 }
    );
  }
}
