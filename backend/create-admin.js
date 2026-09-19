const dotenv = require('dotenv');

dotenv.config();

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node create-admin.js <email> <password>');
  process.exit(1);
}

const apiKey = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyCWS_4wsw5Z_3LL_8MKXbXpg5LzB9T9wm4';

async function createWithRestApi() {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Could not create Firebase user.');
  }

  return data;
}

async function createAdminUser() {
  try {
    const result = await createWithRestApi();
    console.log(`Admin user created successfully.`);
    console.log(`Email: ${email}`);
    console.log(`Local ID: ${result.localId}`);
  } catch (error) {
    console.error('Failed to create admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();
