// src/lib/auth.ts
"use client";

import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
} from "firebase/auth";
import { getAuthClient } from "@/lib/firebase";

/**
 * Client-only auth helpers.
 *
 * Why redirect (not popup)?
 * - iPhone browsers (including Chrome on iOS) can block/lose sessionStorage state
 *   during popup auth flows, causing: "missing initial state".
 * - Redirect auth is the most reliable approach on iOS.
 */

export function listenForAuthChanges(onUser: (user: User | null) => void) {
  const auth = getAuthClient();
  return onAuthStateChanged(auth, onUser);
}

/**
 * Start Google sign-in using redirect (iOS-safe).
 * After redirect completes, `completeGoogleRedirect()` should run once on app load.
 */
export async function signInWithGoogle(): Promise<void> {
  const auth = getAuthClient();
  const provider = new GoogleAuthProvider();

  // Optional: always show account picker
  // provider.setCustomParameters({ prompt: "select_account" });

  await signInWithRedirect(auth, provider);
}

/**
 * Complete the redirect sign-in flow (call once on app load).
 * Returns:
 * - UserCredential if a redirect just completed
 * - null if there is no pending redirect result
 */
export async function completeGoogleRedirect(): Promise<UserCredential | null> {
  const auth = getAuthClient();
  const result = await getRedirectResult(auth);
  return result ?? null;
}

export async function logout(): Promise<void> {
  const auth = getAuthClient();
  await signOut(auth);
}
