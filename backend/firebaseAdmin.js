const admin = require('firebase-admin');

// Initialization priority:
// 1. FIREBASE_SERVICE_ACCOUNT env var (JSON string) — preferred for containerized deploys
// 2. GOOGLE_APPLICATION_CREDENTIALS file path — original local-dev method
// 3. Application Default Credentials — GCP metadata server
// If all fail, the app still starts but Firebase API calls will error until credentials are provided.

if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
        projectId: process.env.FIREBASE_PROJECT_ID || 'cctcsafespace'
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'cctcsafespace'
      });
    }
  } catch (err) {
    console.warn('Firebase Admin credential not available — backend will start but Firebase API calls will fail until credentials are provided:', err.message);
    try {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'cctcsafespace'
      });
    } catch (e) {
      console.error('Firebase Admin could not initialize at all:', e.message);
    }
  }
}

module.exports = admin;
