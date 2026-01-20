/* ============================================================
   FILE: src/app/api/auth/me/route.ts

   SCOPE:
   Auth "me" endpoint (Node runtime)
   - Returns current user from session cookie (or null)
   - Normalizes uid/email to canonical form (trim + lowercase)
   - Awaits getSessionFromServerCookies() (cookies() is async in Next 16)
   ============================================================ */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { getSessionFromServerCookies, normalizeEmail } from "@/lib/auth";

export async function GET() {
  const secret = process.env.SESSION_SECRET || "";
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Missing SESSION_SECRET" }, { status: 500 });
  }

  const s = await getSessionFromServerCookies(secret);

  if (!s) return NextResponse.json({ ok: true, user: null });

  // ✅ Canonicalize on the way out so old cookies can't split identity.
  const email = normalizeEmail(s.email);
  const uid = normalizeEmail(s.uid) || email;

  return NextResponse.json({
    ok: true,
    user: { uid, email, name: s.name || "" },
  });
}
