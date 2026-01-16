/* ============================================================
   FILE: src/app/api/rock-suggest/route.ts

   SCOPE:
   AI Rock suggestions API (STABILITY HARDENED)
   - Adds GET handler that returns 405 (prevents hanging curl requests)
   - POST behavior unchanged
   ============================================================ */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * This route supports BOTH request shapes:
 *
 * Legacy:
 *   { title, draft, finalStatement, dueDate, status, count }
 *
 * New:
 *   { rock: { ...RockFields }, context: { requested: number } }
 *
 * Response:
 *   { ok: true, suggestions: string[] }
 */

type LegacyReqBody = {
  title?: string;
  draft?: string;
  finalStatement?: string;
  dueDate?: string;
  status?: string;
  count?: number;
};

type NewReqBody = {
  rock?: {
    title?: string;
    draft?: string;
    finalStatement?: string;
    dueDate?: string;
    status?: string;

    // Optional extra context fields
    specific?: string;
    measurable?: string;
    achievable?: string;
    relevant?: string;
    timeBound?: string;

    metrics?: Array<{ name?: string; target?: string; current?: string }>;
    milestones?: Array<{ text?: string; dueDate?: string; completed?: boolean }>;
  };
  context?: {
    requested?: number;
    mode?: string;
  };
  count?: number; // allow top-level count too
};

type ReqBody = LegacyReqBody & NewReqBody;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function str(v: unknown) {
  return typeof v === "string" ? v : "";
}

function int(v: unknown, fallback: number) {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function clampCount(n: number) {
  return Math.min(6, Math.max(3, n));
}

/**
 * IMPORTANT:
 * Without a GET handler, curl GET requests can appear to "hang" if the client calls GET.
 * This returns a fast, explicit 405 response to keep testing predictable.
 */
export async function GET() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return jsonError("Missing OPENAI_API_KEY on the server.", 500);

    const body = (await req.json()) as ReqBody;

    // Support both payloads
    const rockFromNew = body?.rock ?? null;

    const title = str(rockFromNew?.title ?? body.title).trim();
    const draft = str(rockFromNew?.draft ?? body.draft).trim();
    const finalStatement = str(rockFromNew?.finalStatement ?? body.finalStatement).trim();
    const dueDate = str(rockFromNew?.dueDate ?? body.dueDate).trim();
    const status = str(rockFromNew?.status ?? body.status).trim();

    const count = clampCount(int(body?.context?.requested, int(body.count, 4)));

    // Optional extra context for better results
    const specific = str(rockFromNew?.specific).trim();
    const measurable = str(rockFromNew?.measurable).trim();
    const achievable = str(rockFromNew?.achievable).trim();
    const relevant = str(rockFromNew?.relevant).trim();
    const timeBound = str(rockFromNew?.timeBound).trim();

    const metrics = Array.isArray(rockFromNew?.metrics) ? rockFromNew!.metrics! : [];
    const milestones = Array.isArray(rockFromNew?.milestones) ? rockFromNew!.milestones! : [];

    const metricsLine =
      metrics.length > 0
        ? `Metrics: ${metrics
            .map((m) => {
              const n = str(m?.name).trim();
              const t = str(m?.target).trim();
              const c = str(m?.current).trim();
              if (!n && !t) return "";
              return `${n || "Metric"} (Target: ${t || "—"}${c ? `, Current: ${c}` : ""})`;
            })
            .filter(Boolean)
            .join("; ")}`
        : "";

    const milestonesLine =
      milestones.length > 0
        ? `Milestones: ${milestones
            .map((m) => {
              const text = str(m?.text).trim();
              const dd = str(m?.dueDate).trim();
              if (!text) return "";
              return `${text}${dd ? ` (${dd})` : ""}`;
            })
            .filter(Boolean)
            .join("; ")}`
        : "";

    const smartLine =
      [specific, measurable, achievable, relevant, timeBound].some(Boolean)
        ? [
            specific ? `Specific: ${specific}` : "",
            measurable ? `Measurable: ${measurable}` : "",
            achievable ? `Achievable: ${achievable}` : "",
            relevant ? `Relevant: ${relevant}` : "",
            timeBound ? `Time-bound: ${timeBound}` : "",
          ]
            .filter(Boolean)
            .join(" | ")
        : "";

    const context = [
      title ? `Title: ${title}` : "",
      status ? `Status: ${status}` : "",
      dueDate ? `Due Date: ${dueDate}` : "",
      draft ? `Draft: ${draft}` : "",
      finalStatement ? `Current Final Statement: ${finalStatement}` : "",
      smartLine ? `SMART: ${smartLine}` : "",
      metricsLine ? metricsLine : "",
      milestonesLine ? milestonesLine : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (!context) {
      return jsonError("No Rock context provided. Send at least title/draft/finalStatement.", 400);
    }

    const prompt = `
You help a user turn a Rock into a SMART Rock final statement.

Task:
- Write ${count} improved Final Rock Statement options.

Rules:
- Each option must be ONE sentence.
- Clear, measurable, and outcome-based.
- Avoid filler words.
- Keep it concise (ideally <= 20 words).
- Do not include numbering or extra commentary.
- Return ONLY valid JSON with this exact shape:
{"suggestions":["...","..."]}

Rock context:
${context}
`.trim();

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: "Return only valid JSON. No markdown. No extra text." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return jsonError(`OpenAI request failed (${resp.status}). ${text.slice(0, 300)}`, 500);
    }

    const data = (await resp.json()) as any;
    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      return jsonError("OpenAI returned no content.", 500);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      return jsonError(`Model did not return valid JSON. Received: ${content.slice(0, 300)}`, 500);
    }

    const raw = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
    const suggestions = raw
      .map((s: any) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean)
      .slice(0, count);

    if (!suggestions.length) {
      return jsonError("No suggestions returned.", 500);
    }

    return NextResponse.json({ ok: true, suggestions });
  } catch (e: any) {
    return jsonError(e?.message || "Unexpected server error.", 500);
  }
}
