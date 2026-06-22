// ─────────────────────────────────────────────────────────────────────────────
// Firebase token verification — two strategies, auto-selected:
//
// Strategy 1 (preferred) — Firebase Admin SDK
//   Requires server secrets:
//     FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//   Get them: Firebase Console → Project Settings → Service accounts → Generate key
//
// Strategy 2 (fallback) — Firebase REST API
//   Requires only the web API key already in VITE_FIREBASE_API_KEY.
//   Works out-of-the-box as soon as the client env vars are set.
// ─────────────────────────────────────────────────────────────────────────────
import admin from "firebase-admin";

// Normalised payload returned by either strategy
export interface FirebaseTokenPayload {
  uid:            string;
  email?:         string;
  email_verified?: boolean;
  name?:          string;
  phone_number?:  string;
  picture?:       string;
}

// ── Strategy 1: Admin SDK ────────────────────────────────────────────────────

let adminApp: admin.app.App | null = null;

function getAdminApp(): admin.app.App | null {
  if (adminApp) return adminApp;

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/\\n/g, "\n")   // unescape literal \n from env var
    .trim();                   // remove any trailing whitespace/newline that breaks DER parsing

  if (!projectId || !clientEmail || !privateKey) return null;

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

async function verifyWithAdminSdk(
  idToken: string,
): Promise<FirebaseTokenPayload | null> {
  const app = getAdminApp();
  if (!app) return null;
  try {
    const decoded = await admin.auth(app).verifyIdToken(idToken);
    return {
      uid:          decoded.uid,
      email:        decoded.email,
      name:         decoded.name,
      phone_number: decoded.phone_number,
      picture:      decoded.picture,
    };
  } catch {
    return null;
  }
}

// ── Strategy 2: Firebase REST API (only needs the web API key) ───────────────

async function verifyWithRestApi(
  idToken: string,
): Promise<FirebaseTokenPayload | null> {
  // The web API key is public and present on both client and server
  const apiKey =
    process.env.VITE_FIREBASE_API_KEY ?? process.env.FIREBASE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ idToken }),
      },
    );
    if (!res.ok) return null;

    const json = await res.json();
    const user = json.users?.[0];
    if (!user) return null;

    return {
      uid:          user.localId,
      email:        user.email        || undefined,
      name:         user.displayName  || undefined,
      phone_number: user.phoneNumber  || undefined,
      picture:      user.photoUrl     || undefined,
    };
  } catch {
    return null;
  }
}

// ── Public helper: tries Admin SDK first, falls back to REST API ─────────────

export async function verifyFirebaseToken(
  idToken: string,
): Promise<FirebaseTokenPayload | null> {
  const adminResult = await verifyWithAdminSdk(idToken);
  if (adminResult) return adminResult;

  return verifyWithRestApi(idToken);
}
