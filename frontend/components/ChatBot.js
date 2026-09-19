import { useEffect, useRef, useState } from 'react';
import LogoSeal from './LogoSeal';
import { API_BASE } from '../lib/api';

const WELCOME =
  "Hello, I’m here to support you and help you report an incident safely and respectfully. I’ll ask a few gentle questions, one at a time, and I’ll keep the conversation calm and private.";

function formatTime(d) {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

function buildLocalAssistantReply(message, conversationMessages = []) {
  const combined = [message, ...(conversationMessages || []).map((entry) => entry?.text || '')]
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

export default function ChatBot({ onMessagesChange, beforeInput, initialPrompt }) {
  const [messages, setMessages] = useState(() => [
    { role: 'bot', text: initialPrompt || WELCOME, ts: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const onMessagesChangeRef = useRef(onMessagesChange);
  onMessagesChangeRef.current = onMessagesChange;

  useEffect(() => {
    onMessagesChangeRef.current?.(messages);
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = { role: 'user', text: trimmed, ts: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    onMessagesChange?.(newMessages);
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, conversation: newMessages })
      });
      const data = await res.json();
      if (data.reply) {
        const updated = [...newMessages, { role: 'bot', text: data.reply, ts: new Date() }];
        setMessages(updated);
        onMessagesChange?.(updated);
      } else {
        const fallbackReply = buildLocalAssistantReply(trimmed, newMessages);
        const updated = [...newMessages, { role: 'bot', text: fallbackReply, ts: new Date() }];
        setMessages(updated);
        onMessagesChange?.(updated);
        setError(data.error || 'The assistant is unavailable right now.');
      }
    } catch (err) {
      console.error(err);
      const fallbackReply = buildLocalAssistantReply(trimmed, newMessages);
      const updated = [...newMessages, { role: 'bot', text: fallbackReply, ts: new Date() }];
      setMessages(updated);
      onMessagesChange?.(updated);
      setError('Unable to reach the assistant. Please try again.');
    } finally {
      setInput('');
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div>
      <div
        style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 12,
          boxShadow: '0 10px 30px rgba(59, 130, 246, 0.18)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.12)'
          }}
        >
          <LogoSeal size={28} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>SafeSpace AI</span>
        </div>
        <div
          style={{
            maxHeight: 320,
            overflowY: 'auto',
            padding: '14px 16px 16px'
          }}
        >
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              style={{
                marginBottom: 12,
                textAlign: m.role === 'user' ? 'right' : 'left'
              }}
            >
              {m.role === 'bot' ? (
                <div
                  style={{
                    display: 'inline-block',
                    textAlign: 'left',
                    maxWidth: '92%',
                    color: '#fff',
                    fontSize: 14,
                    lineHeight: 1.6,
                    background: 'rgba(255,255,255,0.12)',
                    padding: '10px 12px',
                    borderRadius: 12
                  }}
                >
                  {m.text}
                  {m.ts && (
                    <div style={{ marginTop: 8, fontSize: 11, opacity: 0.75 }}>{formatTime(m.ts)}</div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'inline-block',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    padding: '9px 12px',
                    borderRadius: 12,
                    maxWidth: '85%',
                    fontSize: 14,
                    textAlign: 'left'
                  }}
                >
                  {m.text}
                </div>
              )}
            </div>
          ))}
          {loading && <div style={{ color: '#fff', fontSize: 13, marginTop: 4 }}>Thinking…</div>}
          {error && <div style={{ color: '#fde68a', fontSize: 13, marginTop: 6 }}>{error}</div>}
          <div ref={bottomRef} />
        </div>
      </div>

      {beforeInput && <div style={{ marginBottom: 10 }}>{beforeInput}</div>}

      <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Share what happened, who was involved, or how you feel..."
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 'var(--radius-input)',
            border: '1px solid var(--color-border)',
            resize: 'none',
            fontSize: 14
          }}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={loading}
          aria-label="Send"
          style={{
            width: 48,
            flexShrink: 0,
            border: 'none',
            borderRadius: 'var(--radius-input)',
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {loading ? '…' : '➤'}
        </button>
      </div>
    </div>
  );
}
