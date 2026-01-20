/* ============================================================
   FILE: src/app/api/auth/signup/route.ts

   SCOPE:
   Signup API (Node runtime)
   - Creates user record in Firestore (firebase-admin)
   - Issues session cookie (SESSION_SECRET)
   - Email is canonicalized (trim + lowercase) and used as UID
   ============================================================ */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { getFirestore } from "@/lib/firebaseAdmin";
import {
  hashPassword,
  normalizeEmail,
  setSessionCookie,
  createSessionToken,
  type SessionUser,
} from "@/lib/auth";

type Body = { email?: string; password?: string; name?: string };

export async function POST(req: Request) {
  try {
    const secret = process.env.SESSION_SECRET || "";
    if (!secret) {
      return NextResponse.json({ ok: false, error: "Missing SESSION_SECRET" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;

    // ✅ Canonical email: trim + lowercase
    const email = normalizeEmail(body.email);

    // ✅ Defensive trim (iOS autofill can add whitespace)
    const password = typeof body.password === "string" ? body.password.trim() : "";

    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const db = getFirestore();

    // users doc id = normalized email
    const ref = db.collection("users").doc(email);
    const snap = await ref.get();

    if (snap.exists) {
      return NextResponse.json({ ok: false, error: "Account already exists." }, { status: 409 });
    }

    // ✅ UID is ALWAYS the normalized email
    const uid = email;
    const passwordHash = hashPassword(password);

    await ref.set(
      {
        uid,
        email,
        name,
        passwordHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const user: SessionUser = { uid, email };
    if (name) user.name = name;

    const token = createSessionToken(user, secret);
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: { uid: user.uid, email: user.email, name: user.name || "" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Signup failed." },
      { status: 500 }
    );
  }
}
