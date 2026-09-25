const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeEmail, requestCode, verifyCode } = require('../services/emailCodeService');

test('email codes normalize email addresses and are single-use', () => {
  assert.equal(normalizeEmail('  User@Example.com '), 'user@example.com');

  const requested = requestCode('User@Example.com');
  assert.equal(requested.ok, true);
  assert.equal(requested.code.length, 6);
  assert.equal(verifyCode(' user@example.com ', requested.code).ok, true);
  assert.equal(verifyCode('user@example.com', requested.code).ok, false);
});

test('incorrect email codes are rejected', () => {
  const requested = requestCode('invalid-code@example.com');
  assert.equal(requested.ok, true);
  assert.equal(verifyCode('invalid-code@example.com', '000000').ok, false);
});