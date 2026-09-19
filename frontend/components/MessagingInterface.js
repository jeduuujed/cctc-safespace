import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  createConversation,
  getContacts,
  listConversations,
  markConversationRead,
  sendMessage as sendMessageApi
} from '../lib/messagingApi';
import { getMessagingTypesForRole, getRoleLabel } from '../lib/roles';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function contactLabel(contact) {
  if (!contact) return 'Unknown';
  const parts = [contact.name || contact.email];
  if (contact.studentId) parts.push(`ID: ${contact.studentId}`);
  return parts.filter(Boolean).join(' · ');
}

export default function MessagingInterface({ user, profile, defaultType }) {
  const types = getMessagingTypesForRole(profile?.role);
  const [activeType, setActiveType] = useState(defaultType || types[0]?.id || '');
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const pendingSendRef = useRef(null);

  const selected = useMemo(
    () => conversations.find((c) => c.conversationId === selectedId),
    [conversations, selectedId]
  );

  useEffect(() => {
    if (defaultType && getMessagingTypesForRole(profile?.role).some((t) => t.id === defaultType)) {
      setActiveType(defaultType);
    }
  }, [defaultType, profile?.role]);

  const loadConversations = useCallback(async () => {
    if (!user || !activeType) return;
    setLoading(true);
    setError('');
    try {
      const [convData, contactData] = await Promise.all([
        listConversations(user, activeType),
        getContacts(user, activeType)
      ]);
      setConversations(convData.conversations || []);
      setContacts(contactData.contacts || []);
    } catch (err) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user, activeType]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return undefined;
    }

    const q = query(
      collection(db, 'conversations', selectedId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs.map((d) => {
          const data = d.data();
          return {
            messageId: d.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || null
          };
        });
        setMessages(next);
      },
      () => {
        getMessagesFallback();
      }
    );

    async function getMessagesFallback() {
      try {
        const { getMessages } = await import('../lib/messagingApi');
        const data = await getMessages(user, selectedId);
        setMessages(data.messages || []);
      } catch {
        /* listener + API both failed */
      }
    }

    markConversationRead(user, selectedId).catch(() => {});

    return () => unsub();
  }, [selectedId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user || !activeType) return undefined;
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );
    const unsub = onSnapshot(
      q,
      () => {
        listConversations(user, activeType)
          .then((data) => setConversations(data.conversations || []))
          .catch(() => {});
      },
      () => {
        listConversations(user, activeType)
          .then((data) => setConversations(data.conversations || []))
          .catch(() => {});
      }
    );
    return () => unsub();
  }, [user, activeType]);

  const filteredConversations = useMemo(() => {
    const s = search.toLowerCase();
    return conversations.filter((c) => {
      const other = c.otherParticipant;
      if (!s) return true;
      const hay = `${other?.name || ''} ${other?.email || ''} ${other?.studentId || ''}`.toLowerCase();
      return hay.includes(s);
    });
  }, [conversations, search]);

  const filteredContacts = useMemo(() => {
    const s = search.toLowerCase();
    const existingOtherIds = new Set(
      conversations.map((c) => c.participants.find((p) => p !== user.uid)).filter(Boolean)
    );
    return contacts.filter((c) => {
      if (existingOtherIds.has(c.uid)) return false;
      if (!s) return true;
      const hay = `${c.name || ''} ${c.email || ''} ${c.studentId || ''}`.toLowerCase();
      return hay.includes(s);
    });
  }, [contacts, conversations, search, user?.uid]);

  const handleSelect = (conversationId) => {
    setSelectedId(conversationId);
    setError('');
  };

  const handleStartConversation = async (otherUserId) => {
    setError('');
    try {
      const data = await createConversation(user, activeType, otherUserId);
      await loadConversations();
      setSelectedId(data.conversation.conversationId);
    } catch (err) {
      setError(err.message || 'Could not start conversation');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !selectedId || sending) return;

    const clientId = `${Date.now()}-${Math.random()}`;
    pendingSendRef.current = clientId;
    setSending(true);
    setText('');
    setError('');

    try {
      await sendMessageApi(user, selectedId, trimmed);
      await loadConversations();
    } catch (err) {
      if (pendingSendRef.current === clientId) {
        setText(trimmed);
        setError(err.message || 'Failed to send message');
      }
    } finally {
      setSending(false);
      pendingSendRef.current = null;
    }
  };

  if (!types.length) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        Messaging is not available for your account type.
      </div>
    );
  }

  const noCounselor =
    activeType === 'student_counselor' && profile?.role === 'student' && !profile?.assignedCounselorId;

  return (
    <div className="messaging-layout">
      <div className="messaging-sidebar">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
          <div className="messaging-type-tabs">
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                data-active={activeType === t.id}
                onClick={() => {
                  setActiveType(t.id);
                  setSelectedId(null);
                  setSearch('');
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="messaging-search"
          />
        </div>

        <div className="messaging-list">
          {loading && <p style={{ padding: '1rem', fontSize: 14, color: '#666' }}>Loading...</p>}

          {noCounselor && (
            <div className="messaging-empty">
              <p style={{ fontWeight: 600 }}>No counselor assigned</p>
              <p style={{ fontSize: 13, marginTop: 6 }}>
                Your school administrator has not assigned a guidance counselor yet. Please contact the guidance
                office for assistance.
              </p>
            </div>
          )}

          {!loading && !noCounselor && filteredConversations.length === 0 && filteredContacts.length === 0 && (
            <div className="messaging-empty">
              <p>No conversations yet.</p>
              {contacts.length === 0 && activeType === 'student_counselor' && profile?.assignedCounselorId && (
                <button
                  type="button"
                  className="messaging-start-btn"
                  onClick={() => handleStartConversation(profile.assignedCounselorId)}
                >
                  Message your counselor
                </button>
              )}
            </div>
          )}

          {filteredConversations.map((conv) => {
            const other = conv.otherParticipant;
            const unread = conv.unread || conv.unreadCount?.[user.uid] || 0;
            return (
              <button
                key={conv.conversationId}
                type="button"
                className={`messaging-conv-item${selectedId === conv.conversationId ? ' messaging-conv-item--active' : ''}`}
                onClick={() => handleSelect(conv.conversationId)}
              >
                <div className="messaging-conv-avatar">{(other?.name || '?')[0]?.toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{contactLabel(other)}</span>
                    {unread > 0 && <span className="messaging-unread">{unread}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.lastMessage || 'No messages yet'}
                  </div>
                </div>
              </button>
            );
          })}

          {filteredContacts.length > 0 && (
            <div style={{ padding: '0.5rem 1rem', fontSize: 12, fontWeight: 600, color: '#888' }}>
              Start a conversation
            </div>
          )}
          {filteredContacts.map((c) => (
            <button
              key={c.uid}
              type="button"
              className="messaging-conv-item"
              onClick={() => handleStartConversation(c.uid)}
            >
              <div className="messaging-conv-avatar">{(c.name || '?')[0]?.toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{contactLabel(c)}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{getRoleLabel(c.role)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="messaging-main">
        {!selected ? (
          <div className="messaging-empty messaging-empty--center">
            <p>Select a conversation or start a new one.</p>
          </div>
        ) : (
          <>
            <div className="messaging-header">
              <div className="messaging-conv-avatar">{(selected.otherParticipant?.name || '?')[0]?.toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{contactLabel(selected.otherParticipant)}</div>
                <div style={{ fontSize: 13, color: '#666' }}>
                  {getRoleLabel(selected.otherParticipant?.role)}
                </div>
              </div>
            </div>

            <div className="messaging-messages">
              {messages.length === 0 && (
                <p style={{ textAlign: 'center', color: '#888', fontSize: 14, marginTop: '2rem' }}>
                  No messages yet. Say hello!
                </p>
              )}
              {messages.map((msg) => {
                const isMine = msg.senderId === user.uid;
                return (
                  <div
                    key={msg.messageId}
                    className={`messaging-bubble-wrap${isMine ? ' messaging-bubble-wrap--mine' : ''}`}
                  >
                    <div className={`messaging-bubble${isMine ? ' messaging-bubble--mine' : ''}`}>
                      {msg.text}
                    </div>
                    <div className="messaging-time">{formatTime(msg.createdAt)}</div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {error && <p className="messaging-error">{error}</p>}

            <form className="messaging-input-row" onSubmit={handleSend}>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                maxLength={4000}
                disabled={sending}
              />
              <button type="submit" disabled={sending || !text.trim()}>
                {sending ? '...' : 'Send'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
