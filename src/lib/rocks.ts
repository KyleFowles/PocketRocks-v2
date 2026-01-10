// src/lib/rocks.ts
// Purpose: All Firestore operations related to Rocks (CRUD)

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export type Rock = {
  id?: string;
  title: string;
  finalStatement: string;
  status: "On Track" | "At Risk" | "Off Track";
  dueDate: string | null;
  ownerId: string;
  createdAt?: any;
  updatedAt?: any;
};

/**
 * Create a new Rock
 */
export async function createRock(ownerId: string): Promise<string> {
  const ref = await addDoc(collection(db, "rocks"), {
    title: "Untitled Rock",
    finalStatement: "",
    status: "On Track",
    dueDate: null,
    ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

/**
 * Load a Rock by ID
 */
export async function getRock(rockId: string): Promise<Rock | null> {
  const ref = doc(db, "rocks", rockId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return { id: snap.id, ...(snap.data() as Rock) };
}

/**
 * Update a Rock
 */
export async function updateRock(
  rockId: string,
  data: Partial<Rock>
) {
  const ref = doc(db, "rocks", rockId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
