const admin = require("firebase-admin");

let initialized = false;

/**
 * Initialises Firebase Admin SDK once using the base64-encoded (or raw JSON)
 * service-account stored in FIREBASE_SERVICE_ACCOUNT env var.
 *
 * Returns the admin object when ready, null when the env var is missing.
 */
function getFirebaseAdmin() {
  if (initialized) return admin;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    console.warn(
      "WARNING: FIREBASE_SERVICE_ACCOUNT is not set. " +
      "User token verification is disabled — all cart/user requests will return 503."
    );
    return null;
  }

  try {
    // Accept both base64-encoded JSON and raw JSON string
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    } catch {
      serviceAccount = JSON.parse(raw);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });

    initialized = true;
    console.log("Firebase Admin SDK initialised.");
    return admin;
  } catch (err) {
    console.error("Failed to initialise Firebase Admin SDK:", err.message);
    return null;
  }
}

module.exports = { getFirebaseAdmin };
