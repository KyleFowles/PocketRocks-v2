// src/lib/auth.ts
"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getAuthClient } from "@/lib/firebase";

/**
 * Client-only auth helpers.
 */

export function listenForAuthChanges(onUser: (user: User | null) => void) {
  const auth = getAuthClient();
  return onAuthStateChanged(auth, onUser);
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getAuthClient();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logout(): Promise<void> {
  const auth = getAuthClient();
  await signOut(auth);
}
