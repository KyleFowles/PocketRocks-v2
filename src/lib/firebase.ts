// FILE: src/lib/firebase.ts
// SCOPE:
// - Firebase client initialization (Auth + Firestore)
// - Safe singleton caching for Next.js (prevents double-init in dev)
// - Fixes TS error: FirebaseApp | undefined passed to getFirestore()

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseClient = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

let cached: FirebaseClient | null = null;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Optional: helps you catch missing env vars early during build.
function assertEnv() {
  const keys = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ] as const;

  for (const k of keys) {
    if (!process.env[k]) {
      throw new Error(`Missing Firebase env var: ${k}`);
    }
  }
}

export function getFirebaseClient(): FirebaseClient {
  if (cached) return cached;

  // In Next.js, this file can be imported during build/server work.
  // We only want to init the CLIENT SDK when running in the browser.
  if (typeof window === "undefined") {
    throw new Error("getFirebaseClient() called on the server. Use it in client components only.");
  }

  assertEnv();

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  cached = { app, auth, db };
  return cached;
}

// Convenience exports (matches common usage patterns)
export function getAuthClient() {
  return getFirebaseClient().auth;
}

export function getDbClient() {
  return getFirebaseClient().db;
}
