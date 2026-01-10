// src/lib/rocks.ts
"use client";

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

import { getDbClient } from "@/lib/firebase";
import type { Rock } from "@/types/rock";

function rocksCol(uid: string) {
  const db = getDbClient();
  return collection(db, `users/${uid}/rocks`);
}

function rockDoc(uid: string, rockId: string) {
  const db = getDbClient();
  return doc(db, `users/${uid}/rocks/${rockId}`);
}

export async function getRock(uid: string, rockId: string): Promise<Rock | null> {
  const snap = await getDoc(rockDoc(uid, rockId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as DocumentData) } as Rock;
}

export async function listRocks(uid: string, opts?: { includeArchived?: boolean }) {
  const includeArchived = Boolean(opts?.includeArchived);

  const q = includeArchived
    ? query(rocksCol(uid), orderBy("updatedAt", "desc"))
    : query(
        rocksCol(uid),
        where("archived", "==", false),
        orderBy("updatedAt", "desc")
      );

  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Rock[];
}

export async function createRock(uid: string, rock: Rock) {
  const ref = rockDoc(uid, rock.id);
  await setDoc(ref, {
    ...rock,
    archived: Boolean(rock.archived),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRock(uid: string, rockId: string, patch: Partial<Rock>) {
  const ref = rockDoc(uid, rockId);
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}
