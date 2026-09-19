const admin = require('../firebaseAdmin');

async function run() {
  try {
    const uid = process.argv[2] || 'test-user-1';
    const token = await admin.auth().createCustomToken(uid);
    console.log(token);
  } catch (err) {
    console.error('Error creating custom token:', err);
    process.exit(1);
  }
}

run();
