const test = require('node:test');
const assert = require('node:assert/strict');
const { generateAIResponse } = require('../services/openaiService');

test('fallback assistant asks a guided first-step question when no API key is configured', async () => {
  delete process.env.OPENAI_KEY;

  const reply = await generateAIResponse('I was bullied in class today.');

  assert.match(reply.toLowerCase(), /what happened/i);
  assert.match(reply.toLowerCase(), /own words/i);
});
