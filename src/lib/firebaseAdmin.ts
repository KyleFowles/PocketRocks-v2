/* ============================================================
   FILE: src/lib/firebaseAdmin.ts

   SCOPE:
   Firebase Admin (Node-only)
   - Initializes firebase-admin using env vars:
     FIREBASE_PROJECT_ID
     FIREBASE_CLIENT_EMAIL
     FIREBASE_PRIVATE_KEY
   - Exports getFirestore() for server routes
   ============================================================ */

import admin from "firebase-admin";

let _app: admin.app.App | null = null;

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function getAdminApp() {
  if (_app) return _app;

  const projectId = mustEnv("FIREBASE_PROJECT_ID");
  const clientEmail = mustEnv("FIREBASE_CLIENT_EMAIL");
  const privateKeyRaw = mustEnv("FIREBASE_PRIVATE_KEY");

  // Vercel often stores multiline keys with \n literals
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  if (admin.apps.length === 0) {
    _app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    _app = admin.app();
  }

  return _app!;
}

export function getFirestore() {
  getAdminApp();
  return admin.firestore();
}
