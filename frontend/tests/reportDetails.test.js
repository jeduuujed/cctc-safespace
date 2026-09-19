const test = require('node:test');
const assert = require('node:assert/strict');
const { getStudentReportDetails } = require('../lib/reportDetails');

test('returns the student report conversation when chat is available', () => {
  const report = {
    summary: 'Bullying report summary',
    chat: [
      { role: 'user', text: 'A classmate kept mocking me in class.' },
      { role: 'assistant', text: 'Thank you for sharing that.' }
    ]
  };

  const details = getStudentReportDetails(report);

  assert.ok(details.includes('A classmate kept mocking me in class.'));
  assert.ok(details.includes('Thank you for sharing that.'));
  assert.ok(details.includes('Bullying report summary'));
});

test('falls back to the summary when no chat is available', () => {
  const report = {
    summary: 'Summary only'
  };

  const details = getStudentReportDetails(report);

  assert.equal(details, 'Summary only');
});
