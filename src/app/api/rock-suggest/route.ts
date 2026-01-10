// src/app/api/rock-suggest/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ReqBody = {
  title?: string;
  draft?: string;
  finalStatement?: string;
  dueDate?: string;
  status?: string;
  count?: number;
};

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

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return jsonError("Missing OPENAI_API_KEY on the server.", 500);

    const body = (await req.json()) as ReqBody;

    const title = str(body.title).trim();
    const draft = str(body.draft).trim();
    const finalStatement = str(body.finalStatement).trim();
    const dueDate = str(body.dueDate).trim();
    const status = str(body.status).trim();

    const count = Math.min(6, Math.max(3, int(body.count, 4)));

    const context = [
      title ? `Title: ${title}` : "",
      status ? `Status: ${status}` : "",
      dueDate ? `Due Date: ${dueDate}` : "",
      draft ? `Draft: ${draft}` : "",
      finalStatement ? `Current Final Statement: ${finalStatement}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (!context) {
      return jsonError("No Rock context provided. Send at least title/draft/finalStatement.");
    }

    const prompt = `
You help a user turn a Rock into a SMART Rock statement.

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
