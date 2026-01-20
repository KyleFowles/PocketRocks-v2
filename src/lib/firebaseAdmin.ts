/* ============================================================
   FILE: src/lib/firebaseAdmin.ts

   SCOPE:
   Firebase Admin SDK singleton for server-only use (API routes, SSR)
   - Exports getFirebaseAdmin() used by /api routes
   - Admin SDK bypasses Firestore rules (as intended)
   - Reads credentials from env:
     FIREBASE_PROJECT_ID
     FIREBASE_CLIENT_EMAIL
     FIREBASE_PRIVATE_KEY  (supports \n escaping)
   ============================================================ */

import "server-only";

import admin from "firebase-admin";

type AdminBundle = {
  app: admin.app.App;
  auth: admin.auth.Auth;
  firestore: admin.firestore.Firestore;
};

let cached: AdminBundle | null = null;

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return v;
}

function normalizePrivateKey(raw: string): string {
  // Supports either actual newlines or "\n" escaped newlines
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

function initAdmin(): AdminBundle {
  if (cached) return cached;

  const projectId = mustEnv("FIREBASE_PROJECT_ID");
  const clientEmail = mustEnv("FIREBASE_CLIENT_EMAIL");
  const privateKey = normalizePrivateKey(mustEnv("FIREBASE_PRIVATE_KEY"));

  const app =
    admin.apps.length > 0
      ? admin.app()
      : admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });

  cached = {
    app,
    auth: app.auth(),
    firestore: app.firestore(),
  };

  return cached;
}

/**
 * Primary export used by API routes.
 */
export function getFirebaseAdmin(): AdminBundle {
  return initAdmin();
}

/**
 * Convenience exports (optional).
 * Some files may prefer direct helpers.
 */
export function getAdminAuth(): admin.auth.Auth {
  return initAdmin().auth;
}

export function getFirestore(): admin.firestore.Firestore {
  return initAdmin().firestore;
}
