import { fetchWithAuth } from './userProfile';

export async function getContacts(user, type) {
  const token = await user.getIdToken();
  return fetchWithAuth(`/api/messaging/contacts?type=${encodeURIComponent(type)}`, token);
}

export async function listConversations(user, type) {
  const token = await user.getIdToken();
  const q = type ? `?type=${encodeURIComponent(type)}` : '';
  return fetchWithAuth(`/api/messaging/conversations${q}`, token);
}

export async function createConversation(user, type, otherUserId) {
  const token = await user.getIdToken();
  return fetchWithAuth('/api/messaging/conversations', token, {
    method: 'POST',
    body: JSON.stringify({ type, otherUserId })
  });
}

export async function sendMessage(user, conversationId, text) {
  const token = await user.getIdToken();
  return fetchWithAuth('/api/messaging/messages', token, {
    method: 'POST',
    body: JSON.stringify({ conversationId, text })
  });
}

export async function getMessages(user, conversationId) {
  const token = await user.getIdToken();
  return fetchWithAuth(`/api/messaging/conversations/${conversationId}/messages`, token);
}

export async function markConversationRead(user, conversationId) {
  const token = await user.getIdToken();
  return fetchWithAuth(`/api/messaging/conversations/${conversationId}/read`, token, {
    method: 'POST'
  });
}
