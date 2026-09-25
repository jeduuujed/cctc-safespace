const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

function readJsonIfExists(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.warn(`Could not read Firebase service account file: ${error.message}`);
  }
  return null;
}

function findLocalServiceAccount() {
  const backendDir = __dirname;
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const candidates = [
    envPath,
    envPath ? path.resolve(backendDir, envPath) : null,
    path.join(backendDir, 'serviceAccount.json'),
    path.join(backendDir, 'serviceAccountKey.json'),
    path.join(backendDir, 'cctcsafespace-firebase-adminsdk.json')
  ].filter(Boolean);

  try {
    const files = fs.readdirSync(backendDir);
    files
      .filter((name) => /firebase-adminsdk.*\.json$/i.test(name) || /^serviceAccount.*\.json$/i.test(name))
      .forEach((name) => candidates.push(path.join(backendDir, name)));
  } catch {
    // ignore
  }

  for (const candidate of candidates) {
    const parsed = readJsonIfExists(candidate);
    if (parsed?.client_email && parsed?.private_key) {
      return parsed;
    }
  }
  return null;
}

function getCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
    } catch (error) {
      throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ${error.message}`);
    }
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'cctcsafespace',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    });
  }

  const localAccount = findLocalServiceAccount();
  if (localAccount) {
    return admin.credential.cert(localAccount);
  }

  return admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: getCredential(),
      projectId: process.env.FIREBASE_PROJECT_ID || 'cctcsafespace'
    });
  } catch (error) {
    console.warn(
      'Firebase Admin credentials were not found. Login still works with Firebase Auth, but profile/messaging APIs need a service account. Place a serviceAccount.json in backend/ or set GOOGLE_APPLICATION_CREDENTIALS.'
    );
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'cctcsafespace'
    });
  }
}

module.exports = admin;
