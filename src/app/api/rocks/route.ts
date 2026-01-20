/* ============================================================
   FILE: src/app/api/rocks/route.ts

   SCOPE:
   Rocks API (Admin SDK) — list + create
   - Auth uses requireUser()
   - Firestore rules can remain LOCKED DOWN (server uses Admin SDK)

   MIGRATION (one-time, safe copy, no deletes):
   - GET /api/rocks?migrateRoot=1
     Copies from:
       /rocks/{rockId}
     Into:
       /users/{currentUser.uid}/rocks/{rockId}

   Notes:
   - Skips if destination rockId already exists
   - Adds migratedFromRoot + migratedAt
   - Sets userId to current uid
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

async function migrateFromRootRocks() {
  const user = await requireUser();
  const db = getFirestore();

  const rootSnap = await db.collection("rocks").limit(500).get();

  if (rootSnap.empty) {
    return NextResponse.json({
      ok: true,
      migrated: 0,
      skipped: 0,
      totalRoot: 0,
      message: "No docs found in top-level /rocks.",
    });
  }

  const destCol = db.collection("users").doc(user.uid).collection("rocks");

  let migrated = 0;
  let skipped = 0;

  // Firestore batch limit is 500 writes. We keep it <= 500 by using limit(500).
  const batch = db.batch();

  for (const doc of rootSnap.docs) {
    const destRef = destCol.doc(doc.id);
    const existing = await destRef.get();

    if (existing.exists) {
      skipped += 1;
      continue;
    }

    const data = doc.data() || {};

    batch.set(
      destRef,
      {
        ...data,
        id: doc.id,
        userId: user.uid,
        migratedFromRoot: true,
        migratedAt: Date.now(),
      },
      { merge: true }
    );

    migrated += 1;
  }

  if (migrated > 0) {
    await batch.commit();
  }

  return NextResponse.json({
    ok: true,
    migrated,
    skipped,
    totalRoot: rootSnap.size,
    destination: `users/${user.uid}/rocks`,
  });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // ✅ One-time migration: /rocks/{id} -> /users/{uid}/rocks/{id}
    if (url.searchParams.get("migrateRoot") === "1") {
      return await migrateFromRootRocks();
    }

    // ✅ Normal list rocks
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

    const rockId = typeof body?.id === "string" && body.id.trim() ? body.id.trim() : null;

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
