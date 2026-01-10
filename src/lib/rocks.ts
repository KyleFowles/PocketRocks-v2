// src/lib/rocks.ts

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
  type DocumentData,
} from "firebase/firestore";

import type { Rock } from "@/types/rock";
import { getDbClient } from "@/lib/firebase";

/**
 * Firestore path:
 * users/{uid}/rocks/{rockId}
 *
 * NOTE:
 * Rock has NO "archived" field in src/types/rock.ts.
 * Any prior archived logic has been removed to match the type.
 */

function rocksCol(uid: string) {
  const db = getDbClient();
  return collection(db, "users", uid, "rocks");
}

function rockDoc(uid: string, rockId: string) {
  const db = getDbClient();
  return doc(db, "users", uid, "rocks", rockId);
}

function fromDoc(id: string, data: DocumentData): Rock {
  // We trust the stored shape matches Rock; keep runtime mapping minimal.
  return {
    id,
    companyId: String(data.companyId ?? ""),
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
    status: (data.status ?? "on_track") as Rock["status"],

    metrics: Array.isArray(data.metrics) ? data.metrics : [],
    milestones: Array.isArray(data.milestones) ? data.milestones : [],

    weeklyUpdates: Array.isArray(data.weeklyUpdates) ? data.weeklyUpdates : undefined,

    updatedAt: data.updatedAt,
    createdAt: data.createdAt,
  };
}

export async function createRock(uid: string, rock: Rock): Promise<void> {
  const ref = rockDoc(uid, rock.id);

  await setDoc(ref, {
    ...rock,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRock(
  uid: string,
  rockId: string,
  patch: Partial<Omit<Rock, "id">>
): Promise<void> {
  const ref = rockDoc(uid, rockId);

  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function getRock(uid: string, rockId: string): Promise<Rock | null> {
  const ref = rockDoc(uid, rockId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return fromDoc(snap.id, snap.data());
}

/**
 * includeArchived is kept for backward compatibility with earlier UI calls,
 * but is ignored because Rock has no archived field.
 */
export async function listRocks(
  uid: string,
  opts?: { includeArchived?: boolean }
): Promise<Rock[]> {
  void opts; // intentionally unused

  const q = query(rocksCol(uid), orderBy("updatedAt", "desc"));
  const snaps = await getDocs(q);

  return snaps.docs.map((d) => fromDoc(d.id, d.data()));
}
