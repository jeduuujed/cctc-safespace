const admin = require('firebase-admin');

// Initialization using Application Default Credentials.
// Make sure GOOGLE_APPLICATION_CREDENTIALS points to your service account JSON.

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'cctcsafespace'
  });
}

module.exports = admin;

