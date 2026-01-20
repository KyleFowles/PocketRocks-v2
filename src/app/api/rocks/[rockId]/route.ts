/* ============================================================
   FILE: src/app/api/rocks/[rockId]/route.ts

   SCOPE:
   Single Rock API (Admin SDK) — read + patch
   - Auth matches /api/auth/me (SESSION_SECRET + getSessionFromServerCookies)
   - Next.js 16: ctx.params is a Promise (must await)
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

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ rockId: string }> }
) {
  try {
    const user = await requireUser();
    const { rockId } = await ctx.params;

    if (!rockId || !String(rockId).trim()) {
      return NextResponse.json(
        { ok: false, error: "missing_rockId" },
        { status: 400 }
      );
    }

    const db = getFirestore();

    const ref = db
      .collection("users")
      .doc(user.uid)
      .collection("rocks")
      .doc(String(rockId));

    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      item: { id: snap.id, ...snap.data() },
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ rockId: string }> }
) {
  try {
    const user = await requireUser();
    const { rockId } = await ctx.params;

    if (!rockId || !String(rockId).trim()) {
      return NextResponse.json(
        { ok: false, error: "missing_rockId" },
        { status: 400 }
      );
    }

    const patch = (await req.json().catch(() => ({}))) as any;

    const db = getFirestore();

    const ref = db
      .collection("users")
      .doc(user.uid)
      .collection("rocks")
      .doc(String(rockId));

    await ref.set(
      {
        ...patch,
        userId: user.uid,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
