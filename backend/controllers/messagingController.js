const {
  getOrCreateConversation,
  listConversationsForUser,
  sendMessage,
  getMessages,
  markMessagesRead,
  getAuthorizedContacts
} = require('../services/messagingStore');
const { getUserByUid } = require('../services/userStore');
const { VALID_TYPES, getConversationTypesForRole } = require('../services/conversationPolicy');

exports.getContacts = async (req, res) => {
  try {
    const { type } = req.query;
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid conversation type' });
    }
    if (!getConversationTypesForRole(req.profile.role).includes(type) && !req.isAdmin) {
      return res.status(403).json({ error: 'Not authorized for this contact list' });
    }
    const contacts = await getAuthorizedContacts(req.profile, type);
    res.json({ contacts });
  } catch (err) {
    console.error('getContacts error:', err);
    res.status(500).json({ error: 'Failed to load contacts' });
  }
};

exports.listConversations = async (req, res) => {
  try {
    const { type } = req.query;
    const types = type ? [type] : getConversationTypesForRole(req.profile.role);
    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid conversation type' });
    }

    const all = [];
    for (const t of types) {
      const convs = await listConversationsForUser(req.user.uid, t);
      all.push(...convs);
    }

    all.sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });

    const enriched = await Promise.all(
      all.map(async (conv) => {
        const otherId = conv.participants.find((p) => p !== req.user.uid);
        const other = otherId ? await getUserByUid(otherId) : null;
        return {
          ...conv,
          otherParticipant: other,
          unread: conv.unreadCount?.[req.user.uid] || 0
        };
      })
    );

    res.json({ conversations: enriched });
  } catch (err) {
    console.error('listConversations error:', err);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const { type, otherUserId } = req.body;
    if (!VALID_TYPES.includes(type) || !otherUserId) {
      return res.status(400).json({ error: 'type and otherUserId are required' });
    }
    if (!getConversationTypesForRole(req.profile.role).includes(type) && !req.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const conversation = await getOrCreateConversation(req.profile, type, otherUserId);
    const otherId = conversation.participants.find((p) => p !== req.user.uid);
    const other = otherId ? await getUserByUid(otherId) : null;
    res.json({ conversation: { ...conversation, otherParticipant: other, unread: 0 } });
  } catch (err) {
    console.error('createConversation error:', err);
    res.status(400).json({ error: err.message || 'Failed to create conversation' });
  }
};

exports.postMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    if (!conversationId || !text) {
      return res.status(400).json({ error: 'conversationId and text are required' });
    }
    const message = await sendMessage(conversationId, req.profile, text);
    res.json({ message });
  } catch (err) {
    console.error('postMessage error:', err);
    res.status(400).json({ error: err.message || 'Failed to send message' });
  }
};

exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await getMessages(conversationId, req.user.uid);
    res.json({ messages });
  } catch (err) {
    console.error('getConversationMessages error:', err);
    res.status(403).json({ error: err.message || 'Failed to load messages' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    await markMessagesRead(conversationId, req.user.uid);
    res.json({ success: true });
  } catch (err) {
    console.error('markRead error:', err);
    res.status(403).json({ error: err.message || 'Failed to mark read' });
  }
};
