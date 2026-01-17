/* ============================================================
   FILE: src/app/api/auth/login/route.ts

   SCOPE:
   Login API (Node runtime)
   - Uses firebase-admin Firestore
   - Creates session token with SESSION_SECRET
   - ✅ Awaits setSessionCookie() (cookies() is async in Next 16)
   ============================================================ */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { getFirestore } from "@/lib/firebaseAdmin";
import {
  normalizeEmail,
  createSessionToken,
  setSessionCookie,
  verifyPassword,
  type SessionUser,
} from "@/lib/auth";

type Body = { email?: string; password?: string };

export async function POST(req: Request) {
  try {
    const secret = process.env.SESSION_SECRET || "";
    if (!secret) {
      return NextResponse.json({ ok: false, error: "Missing SESSION_SECRET" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;

    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const db = getFirestore();

    // users doc id = normalized email
    const snap = await db.collection("users").doc(email).get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
    }

    const data = snap.data() || {};
    const passwordHash = typeof data.passwordHash === "string" ? data.passwordHash : "";
    const uid = typeof data.uid === "string" ? data.uid : email;
    const name = typeof data.name === "string" ? data.name : "";

    if (!passwordHash || !verifyPassword(password, passwordHash)) {
      return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
    }

    const user: SessionUser = { uid, email };
    if (name.trim()) user.name = name.trim();

    const token = createSessionToken(user, secret);

    // ✅ Next 16: cookies() is async under the hood
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: { uid: user.uid, email: user.email, name: user.name || "" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Login failed." },
      { status: 500 }
    );
  }
}
