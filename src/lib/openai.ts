/* ============================================================
   FILE: src/lib/openai.ts

   SCOPE:
   Server-only OpenAI client for Smart Rocks.
   - Uses the OpenAI JavaScript SDK
   - Reads OPENAI_API_KEY from environment
   - Intended for Next.js Route Handlers (app/api/*)

   NOTES:
   - Do NOT import this file from client components.
   - Requires: npm i openai
   ============================================================ */

import "server-only";
import OpenAI from "openai";

let cached: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (cached) return cached;

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || typeof apiKey !== "string") {
    throw new Error(
      "Missing OPENAI_API_KEY. Add it to your .env.local and restart the dev server."
    );
  }

  cached = new OpenAI({ apiKey });
  return cached;
}
