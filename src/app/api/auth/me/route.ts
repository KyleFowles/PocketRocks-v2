/* ============================================================
   FILE: src/app/api/auth/me/route.ts

   SCOPE:
   Auth "me" endpoint (Node runtime)
   - Returns current user from session cookie (or null)
   - ✅ Awaits getSessionFromServerCookies() (cookies() is async in Next 16)
   ============================================================ */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { getSessionFromServerCookies } from "@/lib/auth";

export async function GET() {
  const secret = process.env.SESSION_SECRET || "";
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Missing SESSION_SECRET" }, { status: 500 });
  }

  const s = await getSessionFromServerCookies(secret);

  if (!s) return NextResponse.json({ ok: true, user: null });

  return NextResponse.json({
    ok: true,
    user: { uid: s.uid, email: s.email, name: s.name || "" },
  });
}
