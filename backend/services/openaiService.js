const OpenAI = require('openai');
const {
  CODE_OF_CONDUCT,
  MINOR_OFFENSES,
  MAJOR_OFFENSES,
  MINOR_CORRECTIVE_MEASURES,
  MAJOR_SANCTIONS
} = require('../data/codeOfConduct');
const { REPORTING_FLOW, REPORTING_SYSTEM_PROMPT, collectCoveredFields } = require('../data/reportingPlaybook');

let client = null;
if (process.env.OPENAI_KEY) {
  client = new OpenAI({ apiKey: process.env.OPENAI_KEY });
}

const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 15000;

function withTimeout(promise, ms = AI_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`OpenAI request timed out after ${ms}ms`)), ms).unref?.()
    )
  ]);
}

function countKeywordMatches(text, keywords) {
  return keywords.filter((keyword) => text.includes(keyword)).length;
}

/**
 * Deterministic severity classifier grounded in the CCTC Student Code of
 * Conduct. Used when no OpenAI key is configured and as a safety net when the
 * model response cannot be parsed. Severity is decided ONLY by matching the
 * described conduct against the handbook offense lists, never by tone.
 */
function createFallbackSeverity(chat) {
  const text = (Array.isArray(chat) ? chat : [chat])
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => entry.text || '')
    .join(' ')
    .toLowerCase();

  let bestMajor = null;
  let bestMajorHits = 0;
  for (const offense of MAJOR_OFFENSES) {
    const hits = countKeywordMatches(text, offense.keywords);
    if (hits > bestMajorHits) {
      bestMajorHits = hits;
      bestMajor = offense;
    }
  }

  let bestMinor = null;
  let bestMinorHits = 0;
  for (const offense of MINOR_OFFENSES) {
    const hits = countKeywordMatches(text, offense.keywords);
    if (hits > bestMinorHits) {
      bestMinorHits = hits;
      bestMinor = offense;
    }
  }

  if (bestMajorHits > 0 && bestMajorHits >= bestMinorHits) {
    return {
      severity: 'Major',
      offenseCategory: bestMajor.rule,
      recommendedSanction: MAJOR_SANCTIONS[0],
      confidence: bestMajorHits >= 2 ? 'high' : 'medium',
      notes:
        'Classified as a Major Offense per the CCTC Student Code of Conduct. First-offense sanction shown; repeat offenses escalate per the handbook sanction table.'
    };
  }

  if (bestMinorHits > 0) {
    return {
      severity: 'Minor',
      offenseCategory: bestMinor.rule,
      recommendedSanction: MINOR_CORRECTIVE_MEASURES[0],
      confidence: bestMinorHits >= 2 ? 'high' : 'medium',
      notes:
        'Classified as a Minor Offense per the CCTC Student Code of Conduct. First-offense corrective measure shown; repeated minor offenses may escalate.'
    };
  }

  return {
    severity: null,
    offenseCategory: '',
    recommendedSanction: '',
    confidence: 'low',
    notes:
      'The reported conduct could not be matched to a specific handbook offense. The Student Discipline Committee will determine the classification based on the gravity of the case.'
  };
}

const SEVERITY_SYSTEM_PROMPT = `You classify reported student misconduct for Consolatrix College of Toledo City, Inc. using ONLY the CCTC Student Code of Conduct provided below.

Base the severity STRICTLY on the handbook offense lists. Never base it on how emotional, intense, or detailed the student's description sounds. Choose the closest matching handbook offense. If nothing matches, return severity null.

Return strict JSON with exactly this shape:
{
  "severity": "Minor" | "Major" | null,
  "offenseCategory": "name of the closest handbook offense, or an empty string",
  "recommendedSanction": "the first-offense measure/sanction for that offense, or an empty string",
  "confidence": "high" | "medium" | "low",
  "notes": "one sentence naming the handbook rule used or, if none, noting that the Student Discipline Committee determines classification"
}

${CODE_OF_CONDUCT.summary}`;

// POST /api/chat reply for the Incident-Reporting Assistant. Uses the reporting
// playbook (guided flow + Code of Conduct severity reference) so the assistant
// always collects one detail at a time and never treats intensity as severity.
function createFallbackReply(message, conversationMessages = [], promptText = '') {
  const history = Array.isArray(conversationMessages) ? conversationMessages : [];
  const userMessages = history
    .filter((entry) => entry?.role === 'user' && typeof entry.text === 'string' && entry.text.trim())
    .map((entry) => entry.text);

  if (!userMessages.length) {
    return 'Thank you for starting a report. This conversation stays private and can be anonymous. Can you tell me, in your own words, what happened? I will guide you one gentle question at a time.';
  }

  const latest = (message || '').trim().toLowerCase();
  const wantsToFinish = /(submit|ready|done|confirm|finish|review)/i.test(latest);

  const covered = collectCoveredFields([...history, ...(latest ? [{ role: 'user', text: message }] : [])]);

  if (wantsToFinish || covered.includes('verify')) {
    const severity = createFallbackSeverity(history).severity;
    const classification =
      severity === 'Major' || severity === 'Minor'
        ? `Based on the CCTC Student Code of Conduct, this appears to be a ${severity} Offense. `
        : '';
    return (
      `Thank you for sharing these details with me. I can now prepare a clear report summary for you to review. ` +
      `${classification}Final classification is decided by the Student Discipline Committee. ` +
      `Reply "confirm" to submit your report.`
    );
  }

  const nextField = REPORTING_FLOW.find((field) => field.key !== 'incident' && !covered.includes(field.key));
  if (nextField) {
    return nextField.prompt;
  }

  return (
    'Thank you. You have shared the key details. Would you like me to prepare a short report summary for you to review and submit? Reply "confirm" to proceed.'
  );
}

function safeParseJson(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function createFallbackSummary(chat) {
  const parsed = safeParseJson(chat);
  const messages = Array.isArray(parsed) ? parsed : [];
  const userTexts = messages
    .filter((entry) => entry && entry.role === 'user' && typeof entry.text === 'string')
    .map((entry) => entry.text.trim())
    .filter(Boolean);

  if (userTexts.length) {
    const combinedText = userTexts.join(' ').replace(/\s+/g, ' ').trim();
    return `Student report summary: ${combinedText}.`;
  }

  if (typeof chat === 'string' && chat.trim()) {
    const cleaned = parsed ? '' : chat.replace(/\s+/g, ' ').trim();
    if (cleaned) {
      return `Student report summary: ${cleaned}.`;
    }
  }

  return 'Student report summary: No details were provided. The report was created from the student conversation.';
}

exports.generateAIResponse = async (message, conversationMessages = [], promptText = '') => {
  const history = (Array.isArray(conversationMessages) ? conversationMessages : [])
    .map((entry) => ({
      role: entry.role === 'assistant' || entry.role === 'bot' ? 'assistant' : 'user',
      content: entry.text || ''
    }))
    .filter((entry) => entry.content.trim());

  if (!client) {
    return createFallbackReply(message, conversationMessages, promptText);
  }

  const covered = collectCoveredFields([
    ...(Array.isArray(conversationMessages) ? conversationMessages : []),
    ...(message && typeof message === 'string' ? [{ role: 'user', text: message }] : [])
  ]);

  const systemContent = [
    REPORTING_SYSTEM_PROMPT,
    '',
    `FIELDS ALREADY COVERED IN THIS CONVERSATION: ${covered.join(', ') || 'none'}.`,
    covered.includes('verify')
      ? 'The flow is complete. Prompt the student to review and confirm the report summary before submitting.'
      : 'Ask for ONLY the next uncovered detail in the REPORTING FLOW. Do not repeat a field that is already covered.'
  ]
    .concat(promptText ? `Session guidance:\n${promptText}` : [])
    .join('\n\n');

  try {
    const response = await withTimeout(
      client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContent },
          ...history,
          { role: 'user', content: message }
        ]
      })
    );

    return response.choices[0].message.content || createFallbackReply(message, conversationMessages, promptText);
  } catch (err) {
    console.error('generateAIResponse failed, using fallback:', err.message);
    return createFallbackReply(message, conversationMessages, promptText);
  }
};

exports.generateSummary = async (chat) => {
  if (!client) {
    return createFallbackSummary(chat);
  }

  try {
    const response = await withTimeout(
      client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Summarize this student incident report clearly and concisely. Classify the described conduct ONLY against the CCTC Student Code of Conduct severity reference below (Minor vs Major Offense) if a match exists, and never judge by how intense the description sounds. Any preliminary classification is subject to review by the Student Discipline Committee, so state that when you give one.\n\n${CODE_OF_CONDUCT.summary}`
          },
          { role: 'user', content: chat }
        ]
      })
    );

    return response.choices[0].message.content || createFallbackSummary(chat);
  } catch (err) {
    console.error('generateSummary failed, using fallback:', err.message);
    return createFallbackSummary(chat);
  }
};

exports.classifyIncidentSeverity = async (chat) => {
  const fallback = createFallbackSeverity(chat);
  if (!client) {
    return fallback;
  }

  try {
    const response = await withTimeout(
      client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SEVERITY_SYSTEM_PROMPT },
          { role: 'user', content: `Student report conversation: ${JSON.stringify(Array.isArray(chat) ? chat : [chat])}` }
        ]
      })
    );

    const raw = response.choices[0].message.content || '';
    const parsed = JSON.parse(raw);
    return {
      severity: parsed.severity === 'Minor' || parsed.severity === 'Major' ? parsed.severity : null,
      offenseCategory: typeof parsed.offenseCategory === 'string' ? parsed.offenseCategory : fallback.offenseCategory || '',
      recommendedSanction:
        typeof parsed.recommendedSanction === 'string' ? parsed.recommendedSanction : fallback.recommendedSanction || '',
      confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
      notes: typeof parsed.notes === 'string' ? parsed.notes : fallback.notes || ''
    };
  } catch (err) {
    console.error('Severity classification failed, using handbook fallback:', err.message);
    return fallback;
  }
};

module.exports.createFallbackSeverity = createFallbackSeverity;