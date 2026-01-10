/* ============================================================
   FILE: src/lib/openai.ts

   SCOPE:
   Server-only OpenAI client for Smart Rocks.
   - Uses the OpenAI JavaScript SDK
   - Reads OPENAI_API_KEY from environment
   - Intended for Next.js Route Handlers (app/api/*)

   NOTES:
   - Do NOT import this file from client components.
   - Requires: npm i openai zod
   ============================================================ */

import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    "Missing OPENAI_API_KEY. Add it to your .env.local and restart the dev server."
  );
}

export const openai = new OpenAI({ apiKey });
