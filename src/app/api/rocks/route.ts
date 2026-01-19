/* ============================================================
   FILE: src/app/api/rocks/route.ts

   SCOPE:
   Rocks API (Admin SDK) — list + create
   - Auth matches /api/auth/me (SESSION_SECRET + getSessionFromServerCookies)
   - Firestore rules can remain LOCKED DOWN (server uses Admin SDK)
   ============================================================ */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { requireUser } from "@/lib/authServer";
import { getFirestore } from "@/lib/firebaseAdmin";

function jsonError(err: any) {
  const status = typeof err?.status === "number" ? err.status : 500;
  const message = typeof err?.message === "string" ? err.message : "Server error";
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET() {
  try {
    const user = await requireUser();
    const db = getFirestore();

    const snap = await db
      .collection("users")
      .doc(user.uid)
      .collection("rocks")
      .orderBy("updatedAt", "desc")
      .limit(200)
      .get();

    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const db = getFirestore();

    const body = (await req.json().catch(() => ({}))) as any;

    const rockId =
      typeof body?.id === "string" && body.id.trim() ? body.id.trim() : null;

    const now = Date.now();

    const data = {
      ...body,
      userId: user.uid,
      createdAt: typeof body?.createdAt === "number" ? body.createdAt : now,
      updatedAt: now,
    };

    const col = db.collection("users").doc(user.uid).collection("rocks");

    if (rockId) {
      await col.doc(rockId).set(data, { merge: true });
      return NextResponse.json({ ok: true, id: rockId });
    }

    const ref = await col.add(data);
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (err) {
    return jsonError(err);
  }
}
