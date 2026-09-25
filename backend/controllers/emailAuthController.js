const admin = require('../firebaseAdmin');
const { sendLoginCode } = require('../services/emailService');
const { normalizeEmail, requestCode, verifyCode } = require('../services/emailCodeService');

exports.requestCode = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  try {
    await admin.auth().getUserByEmail(email);
    const result = requestCode(email);
    if (!result.ok) return res.status(429).json({ error: result.error });
    await sendLoginCode(email, result.code);
    return res.json({ message: 'A six-digit authentication code was sent to your Gmail inbox.' });
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'No SafeSpace account was found for that email.' });
    }
    console.error('request email code error:', err);
    return res.status(503).json({ error: 'Could not send an authentication code.' });
  }
};

exports.verifyCode = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const codeResult = verifyCode(email, req.body?.code);
  if (!codeResult.ok) return res.status(401).json({ error: codeResult.error });

  try {
    const user = await admin.auth().getUserByEmail(email);
    const customToken = await admin.auth().createCustomToken(user.uid);
    return res.json({ customToken });
  } catch (err) {
    console.error('verify email code error:', err);
    return res.status(401).json({ error: 'Authentication could not be completed. Request a new code.' });
  }
};