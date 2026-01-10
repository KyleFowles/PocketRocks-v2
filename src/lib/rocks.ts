// FILE: src/lib/rocks.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";

import type { Rock } from "@/types/rock";
import { getDbClient } from "@/lib/firebase";

type ListOpts = {
  includeArchived?: boolean;
};

function rocksCollectionRef(uid: string) {
  const db = getDbClient();
  return collection(db, "users", uid, "rocks");
}

function rockDocRef(uid: string, rockId: string) {
  const db = getDbClient();
  return doc(db, "users", uid, "rocks", rockId);
}

function normalizeRock(id: string, data: DocumentData): Rock {
  // Ensure we always return a valid Rock shape for the app.
  // Any missing fields get safe defaults (keeps UI stable).
  return {
    id,
    companyId: String(data.companyId ?? "default"),
    ownerId: String(data.ownerId ?? ""),

    title: String(data.title ?? ""),
    finalStatement: String(data.finalStatement ?? ""),

    draft: String(data.draft ?? ""),
    specific: String(data.specific ?? ""),
    measurable: String(data.measurable ?? ""),
    achievable: String(data.achievable ?? ""),
    relevant: String(data.relevant ?? ""),
    timeBound: String(data.timeBound ?? ""),

    dueDate: String(data.dueDate ?? ""),
    status: (data.status as any) ?? "on_track",

    metrics: Array.isArray(data.metrics) ? data.metrics : [],
    milestones: Array.isArray(data.milestones) ? data.milestones : [],

    weeklyUpdates: Array.isArray(data.weeklyUpdates) ? data.weeklyUpdates : undefined,

    updatedAt: data.updatedAt,
    createdAt: data.createdAt,
  };
}

/**
 * List Rocks for a user.
 * - archived is a Firestore field we store even though it's not in the Rock type yet.
 * - includeArchived=false (default) filters archived out.
 */
export async function listRocks(uid: string, opts: ListOpts = {}): Promise<Rock[]> {
  const includeArchived = Boolean(opts.includeArchived);

  const col = rocksCollectionRef(uid);

  // If we’re not including archived, filter them out.
  // We treat "archived == true" as archived, and missing/false as active.
  const q = includeArchived
    ? query(col, orderBy("updatedAt", "desc"))
    : query(
        col,
        where("archived", "in", [false, null]),
        orderBy("updatedAt", "desc")
      );

  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeRock(d.id, d.data()));
}

/**
 * Get a single Rock by id.
 */
export async function getRock(uid: string, rockId: string): Promise<Rock | null> {
  const ref = rockDocRef(uid, rockId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return normalizeRock(snap.id, snap.data());
}

/**
 * Update an existing Rock.
 * (If the doc doesn’t exist, Firestore will create it with updateDoc? -> No.
 * updateDoc requires the doc to exist, so we use setDoc with merge here.)
 */
export async function updateRock(uid: string, rock: Rock): Promise<void> {
  const ref = rockDocRef(uid, rock.id);

  // Preserve archived even though it’s not in the Rock type.
  const archived = Boolean((rock as any).archived);

  await setDoc(
    ref,
    {
      ...rock,
      archived,
      updatedAt: serverTimestamp(),
      createdAt: (rock as any).createdAt ?? serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Save a Rock (create or update).
 * This is the API your pages expect.
 */
export async function saveRock(uid: string, rock: Rock): Promise<void> {
  // For MVP, create/update are the same operation (merge).
  return updateRock(uid, rock);
}

/**
 * Archive a Rock (soft delete).
 */
export async function archiveRock(uid: string, rockId: string): Promise<void> {
  const ref = rockDocRef(uid, rockId);
  await updateDoc(ref, {
    archived: true,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Restore an archived Rock.
 */
export async function restoreRock(uid: string, rockId: string): Promise<void> {
  const ref = rockDocRef(uid, rockId);
  await updateDoc(ref, {
    archived: false,
    updatedAt: serverTimestamp(),
  });
}
