/* ============================================================
   FILE: src/lib/rocks.ts

   SCOPE:
   Rock persistence (STABILITY HARDENED)
   - saveRock(): create new Rock
   - getRock(): read Rock (user-scoped)
   - updateRock(): patch existing Rock (user-scoped)
   - Never sends undefined to Firestore
   - Normalizes optional arrays
   - Friendly errors + dev logging
   ============================================================ */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";

import { db, getFirebaseConfigStatus } from "@/lib/firebase";
import type { Rock } from "@/types/rock";

const ROCKS_COLLECTION = "rocks";

/* -----------------------------
   Helpers
------------------------------ */

function safeTrim(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function devError(...args: any[]) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
}

function firebaseErrorMessage(e: any): string {
  const code = typeof e?.code === "string" ? e.code : "";
  const msg = typeof e?.message === "string" ? e.message : "Unknown error";

  if (code.includes("permission-denied"))
    return "permission-denied: Firestore blocked the request.";
  if (code.includes("unauthenticated"))
    return "unauthenticated: Please sign in.";
  if (code.includes("unavailable"))
    return "unavailable: Network/Firestore unavailable.";
  if (code.includes("invalid-argument"))
    return "invalid-argument: Bad data was sent.";

  return code ? `${code}: ${msg}` : msg;
}

function normalizeRockData(data: any) {
  if (!data || typeof data !== "object") return data;

  if (!Array.isArray(data.metrics)) data.metrics = [];
  if (!Array.isArray(data.milestones)) data.milestones = [];

  data.title = safeTrim(data.title) || "Untitled Rock";
  data.draft = safeTrim(data.draft) || "";
  data.dueDate = safeTrim(data.dueDate) || "";
  if (typeof data.step !== "number") data.step = 1;

  return data;
}

function stripUndefinedDeep(input: any): any {
  if (input === undefined) return undefined;
  if (Array.isArray(input))
    return input.map(stripUndefinedDeep).filter((x) => x !== undefined);
  if (input && typeof input === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(input)) {
      const cleaned = stripUndefinedDeep(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  return input;
}

/**
 * Returns a NON-NULL Firestore instance or throws a friendly error.
 * This fixes TS errors caused by db being typed as Firestore | null.
 */
function requireDb(): Firestore {
  const status = getFirebaseConfigStatus();
  if (!status.ok) {
    throw new Error(`config: Firebase env missing: ${status.missing.join(", ")}`);
  }
  if (!db) {
    throw new Error("init: Firebase not initialized.");
  }
  return db;
}

/* -----------------------------
   Create
------------------------------ */

export async function saveRock(input: Partial<Rock>, userId: string): Promise<string> {
  const uid = safeTrim(userId);
  if (!uid) throw new Error("auth: Missing userId.");

  const firestore = requireDb();

  try {
    const payload = {
      ...stripUndefinedDeep(input),
      userId: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(firestore, ROCKS_COLLECTION), payload);
    return ref.id;
  } catch (e: any) {
    devError("[saveRock]", e);
    throw new Error(firebaseErrorMessage(e));
  }
}

/* -----------------------------
   Read
------------------------------ */

export async function getRock(userId: string, rockId: string): Promise<Rock | null> {
  const uid = safeTrim(userId);
  const rid = safeTrim(rockId);

  if (!uid) throw new Error("auth: Missing userId.");
  if (!rid) throw new Error("getRock: Missing rockId.");

  const firestore = requireDb();

  try {
    const ref = doc(firestore, ROCKS_COLLECTION, rid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data() as DocumentData;
    if (data.userId !== uid) {
      throw new Error("permission-denied: Not your Rock.");
    }

    return normalizeRockData({ id: snap.id, ...data }) as Rock;
  } catch (e: any) {
    devError("[getRock]", e);
    throw new Error(firebaseErrorMessage(e));
  }
}

/* -----------------------------
   Update (PATCH)
------------------------------ */

export async function updateRock(
  userId: string,
  rockId: string,
  patch: Partial<Rock>
): Promise<void> {
  const uid = safeTrim(userId);
  const rid = safeTrim(rockId);

  if (!uid) throw new Error("auth: Missing userId.");
  if (!rid) throw new Error("updateRock: Missing rockId.");

  const firestore = requireDb();

  try {
    const ref = doc(firestore, ROCKS_COLLECTION, rid);

    const cleaned = stripUndefinedDeep(patch);

    await updateDoc(ref, {
      ...cleaned,
      updatedAt: serverTimestamp(),
    });
  } catch (e: any) {
    devError("[updateRock]", e);
    throw new Error(firebaseErrorMessage(e));
  }
}
