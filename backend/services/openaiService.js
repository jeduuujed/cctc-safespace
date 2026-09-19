const OpenAI = require('openai');

let client = null;
if (process.env.OPENAI_KEY) {
  client = new OpenAI({ apiKey: process.env.OPENAI_KEY });
}

function createFallbackReply(message, conversationMessages = [], promptText = '') {
  const combined = [message, promptText, ...(conversationMessages || []).map((entry) => entry?.text || '')]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();

  const userMessages = (conversationMessages || []).filter((entry) => entry?.role === 'user').map((entry) => entry.text || '');
  const hasDetails = userMessages.some((text) => text.length > 12);

  if (!conversationMessages || conversationMessages.length <= 1) {
    return 'Thank you for telling me. I can help you with this gently and step by step. Can you tell me what happened in your own words?';
  }

  if (/(submit|ready|done|confirm|finish|review)/i.test(message)) {
    return 'Thank you for sharing this with me. I can help you turn your conversation into a clear report summary before you submit it.';
  }

  if (/(who|person|classmate|teacher|friend|group|student|staff)/i.test(combined)) {
    return 'Thank you for sharing that. Could you tell me where it happened and whether it has happened more than once?';
  }

  if (/(where|place|class|hall|bathroom|home|school|office)/i.test(combined)) {
    return 'I appreciate you sharing that. If you feel comfortable, could you tell me who was involved and how it affected you?';
  }

  if (/(when|today|yesterday|time|morning|afternoon|evening|before|after|during)/i.test(combined)) {
    return 'Thank you. How did this make you feel, and do you have any evidence or witnesses you would like to mention?';
  }

  if (/(feel|scared|sad|angry|upset|worried|unsafe|hurt)/i.test(combined)) {
    return 'I am sorry this happened. Can you tell me whether it has happened more than once and whether anyone else saw it?';
  }

  if (hasDetails) {
    return 'Thank you for being honest with me. I will keep guiding you carefully. Could you tell me whether this happened once or more than once?';
  }

  return 'I am here to support you. Please tell me what happened in your own words, and I will guide you one step at a time.';
}

function createFallbackSummary(chat) {
  const messages = Array.isArray(chat) ? chat : [];
  const userTexts = messages
    .filter((entry) => entry && entry.role === 'user' && typeof entry.text === 'string')
    .map((entry) => entry.text.trim())
    .filter(Boolean);

  if (!userTexts.length) {
    return 'Student report summary: No details were provided. The report was created from the student conversation.';
  }

  const combinedText = userTexts.join(' ').replace(/\s+/g, ' ').trim();
  return `Student report summary: ${combinedText}.`;
}

exports.generateAIResponse = async (message, conversationMessages = [], promptText = '') => {
  if (!client) {
    return createFallbackReply(message, conversationMessages, promptText);
  }

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: message }]
  });

  return response.choices[0].message.content;
};

exports.generateSummary = async (chat) => {
  if (!client) {
    return createFallbackSummary(chat);
  }

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Summarize this bullying incident report clearly and concisely.' },
      { role: 'user', content: chat }
    ]
  });

  return response.choices[0].message.content;
};

