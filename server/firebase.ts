// ─────────────────────────────────────────────────────────────────────────────
// Firebase Admin SDK — server-side token verification
//
// Set these in your Replit Secrets:
//   FIREBASE_PROJECT_ID      — e.g. "my-eventelite-app"
//   FIREBASE_CLIENT_EMAIL    — from your service account JSON
//   FIREBASE_PRIVATE_KEY     — from your service account JSON (include \n characters)
//
// To get a service account:
//   Firebase Console → Project Settings → Service accounts → Generate new private key
// ─────────────────────────────────────────────────────────────────────────────
import admin from "firebase-admin";

let adminApp: admin.app.App | null = null;

export function getAdminApp(): admin.app.App | null {
  if (adminApp) return adminApp;

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    // Firebase Admin not configured — social auth will be unavailable
    return null;
  }

  try {
    adminApp = admin.apps.length
      ? admin.apps[0]!
      : admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
    return adminApp;
  } catch (err) {
    console.error("Firebase Admin init failed:", err);
    return null;
  }
}

export async function verifyFirebaseToken(
  idToken: string,
): Promise<admin.auth.DecodedIdToken | null> {
  const app = getAdminApp();
  if (!app) return null;
  try {
    return await admin.auth(app).verifyIdToken(idToken);
  } catch {
    return null;
  }
}
