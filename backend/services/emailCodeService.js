const crypto = require('crypto');

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const REQUEST_COOLDOWN_MS = 60 * 1000;
const pendingCodes = new Map();

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function createCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function requestCode(email) {
  const normalizedEmail = normalizeEmail(email);
  const existing = pendingCodes.get(normalizedEmail);
  const now = Date.now();

  if (existing && now - existing.requestedAt < REQUEST_COOLDOWN_MS) {
    return { ok: false, error: 'Please wait before requesting another code.' };
  }

  const code = createCode();
  pendingCodes.set(normalizedEmail, {
    hash: hashCode(code),
    expiresAt: now + CODE_TTL_MS,
    requestedAt: now,
    attempts: 0
  });
  return { ok: true, code };
}

function verifyCode(email, code) {
  const normalizedEmail = normalizeEmail(email);
  const pending = pendingCodes.get(normalizedEmail);
  if (!pending || Date.now() > pending.expiresAt) {
    pendingCodes.delete(normalizedEmail);
    return { ok: false, error: 'That code has expired. Request a new code.' };
  }

  pending.attempts += 1;
  if (pending.attempts > MAX_ATTEMPTS) {
    pendingCodes.delete(normalizedEmail);
    return { ok: false, error: 'Too many incorrect attempts. Request a new code.' };
  }

  const submittedHash = hashCode(typeof code === 'string' ? code.trim() : '');
  if (submittedHash !== pending.hash) {
    return { ok: false, error: 'Invalid authentication code.' };
  }

  pendingCodes.delete(normalizedEmail);
  return { ok: true };
}

module.exports = { normalizeEmail, requestCode, verifyCode };