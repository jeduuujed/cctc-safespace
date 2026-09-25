const test = require('node:test');
const assert = require('node:assert/strict');
const {
  generateAIResponse,
  generateSummary,
  classifyIncidentSeverity,
  createFallbackSeverity
} = require('../services/openaiService');

test('fallback assistant asks a guided first-step question when no API key is configured', async () => {
  delete process.env.OPENAI_KEY;

  const reply = await generateAIResponse('I was bullied in class today.');

  assert.match(reply.toLowerCase(), /what happened/i);
  assert.match(reply.toLowerCase(), /own words/i);
});

test('fallback summary includes the student details instead of reporting none', async () => {
  delete process.env.OPENAI_KEY;

  const summary = await generateSummary(
    JSON.stringify([
      { role: 'user', text: 'I was bullied by a classmate yesterday' },
      { role: 'assistant', text: 'Can you tell me where?' },
      { role: 'user', text: 'In the comfort room' }
    ])
  );

  assert.match(summary, /I was bullied by a classmate yesterday/);
  assert.match(summary, /In the comfort room/);
  assert.doesNotMatch(summary, /No details were provided/i);
});

test('classifies bullying as a Major Offense from the handbook', async () => {
  delete process.env.OPENAI_KEY;

  const result = await classifyIncidentSeverity([
    { role: 'user', text: 'I was bullied by a group in my class. They mock me every day and laugh at me online in our group chat.' }
  ]);

  assert.equal(result.severity, 'Major');
  assert.match(result.offenseCategory, /bullying|cyber/i);
  assert.match(result.recommendedSanction, /suspension/i);
});

test('classifies drug / alcohol use as a Major Offense', async () => {
  delete process.env.OPENAI_KEY;

  const result = await classifyIncidentSeverity([
    { role: 'user', text: 'Some students were smoking shabu in the comfort room during break.' }
  ]);

  assert.equal(result.severity, 'Major');
  assert.match(result.offenseCategory, /drugs|alcohol|controlled substance/i);
});

test('classifies not wearing the uniform as a Minor Offense', async () => {
  delete process.env.OPENAI_KEY;

  const result = await classifyIncidentSeverity([
    { role: 'user', text: 'I was flagged because I was not wearing the proper uniform today.' }
  ]);

  assert.equal(result.severity, 'Minor');
  assert.match(result.offenseCategory, /uniform/i);
  assert.match(result.recommendedSanction, /Verbal Reprimand/i);
});

test('returns an unclassified result when no handbook offense matches', async () => {
  delete process.env.OPENAI_KEY;

  const result = await createFallbackSeverity([
    { role: 'user', text: 'I feel a little stressed about my grades, nothing specific happened.' }
  ]);

  assert.equal(result.severity, null);
  assert.equal(result.offenseCategory, '');
  assert.match(result.notes, /Student Discipline Committee/i);
});

test('severity is decided by the handbook, not by emotional intensity', async () => {
  delete process.env.OPENAI_KEY;

  const emotional = await createFallbackSeverity([
    { role: 'user', text: 'I am extremely devastated, crying, terrified, hopeless and heartbroken because I got caught cutting classes and loitering in the corridor.' }
  ]);

  assert.equal(emotional.severity, 'Minor');

  const calmButMajor = await createFallbackSeverity([
    { role: 'user', text: 'A classmate was threatening the teacher and refused to follow instructions in a calm, quiet way.' }
  ]);

  assert.equal(calmButMajor.severity, 'Major');
  assert.match(calmButMajor.offenseCategory, /Disrespect|Threatening/i);
});

test('fallback guides to collect who was involved next when it is still missing', async () => {
  delete process.env.OPENAI_KEY;

  const reply = await generateAIResponse('It happened during our first period, in the hallway.', [
    { role: 'user', text: 'Someone stole my phone from my bag.' }
  ]);

  assert.match(reply, /who was involved|who was there/i);
  assert.match(reply, /first names/i);
});

test('fallback skips already-covered details and asks for the next missing one', async () => {
  delete process.env.OPENAI_KEY;

  const reply = await generateAIResponse('It was in the hallway.', [
    { role: 'user', text: 'Someone stole my phone from my bag.' },
    { role: 'bot', text: 'Can you tell me who was involved?' },
    { role: 'user', text: 'A classmate took it.' },
    { role: 'bot', text: 'When did it happen?' },
    { role: 'user', text: 'Yesterday during first period.' }
  ]);

  assert.match(reply, /only once, or more than once/i);
});

test('fallback moves to confirmation and notes committee review once all details are covered', async () => {
  delete process.env.OPENAI_KEY;

  const reply = await generateAIResponse('Yes I want to confirm it.', [
    { role: 'user', text: 'A classmate has been teasing me.' },
    { role: 'user', text: 'It is a boy in my section.' },
    { role: 'user', text: 'It started last week during recess.' },
    { role: 'user', text: 'It happens in the canteen.' },
    { role: 'user', text: 'It happens every day.' },
    { role: 'user', text: 'I feel anxious and scared to go to school.' },
    { role: 'user', text: 'A friend of mine saw it happen.' }
  ]);

  assert.match(reply, /Student Discipline Committee/i);
  assert.match(reply, /confirm/i);
  assert.match(reply, /submit your report/i);
});