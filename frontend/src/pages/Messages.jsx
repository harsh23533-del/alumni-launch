import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import usePageTitle from '../hooks/usePageTitle';

export default function Messages() {
  usePageTitle('Messages', 'Your private conversations — visible only to you and the other person.');
  const location = useLocation();

  const [me, setMe] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null); // { other_user_id, other_user_name, idea_id, idea_title }
  const [thread, setThread] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadMe = async () => {
    const res = await api.get('/auth/me');
    setMe(res.data);
  };

  const loadConversations = async () => {
    const res = await api.get('/messages/conversations');
    setConversations(res.data);
    return res.data;
  };

  const openThread = async (conv) => {
    setActive(conv);
    const res = await api.get(`/messages/thread/${conv.other_user_id}`);
    setThread(res.data);
    loadConversations(); // refresh unread counts
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadMe();
      const convs = await loadConversations();

      // Arrived here from an idea's "Message" button — open/create that thread.
      const navState = location.state;
      if (navState?.toUserId) {
        const existing = convs.find((c) => c.other_user_id === navState.toUserId);
        const conv = existing || {
          other_user_id: navState.toUserId,
          other_user_name: navState.toName,
          idea_id: navState.ideaId,
          idea_title: navState.ideaTitle,
        };
        await openThread(conv);
      } else if (convs.length > 0) {
        await openThread(convs[0]);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    setSending(true);
    try {
      await api.post('/messages', {
        receiver_id: active.other_user_id,
        idea_id: active.idea_id || location.state?.ideaId || null,
        content: text.trim(),
      });
      setText('');
      const res = await api.get(`/messages/thread/${active.other_user_id}`);
      setThread(res.data);
      loadConversations();
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="page" style={{ paddingTop: 32 }}><p style={{ color: 'var(--text-dim)' }}>Loading messages…</p></div>;
  }

  return (
    <div className="page" style={{ paddingTop: 32 }}>
      <h2 style={{ fontSize: 26, marginBottom: 4 }}>Messages</h2>
      <p style={{ color: 'var(--text-dim)', fontSize: 13.5, marginBottom: 20 }}>
        Private conversations — only you and the other person can see these.
      </p>

      <div style={{ display: 'flex', gap: 16, minHeight: 420, flexWrap: 'wrap' }}>
        {/* Conversation list */}
        <div className="card" style={{ width: 280, flexShrink: 0, padding: 8, maxHeight: 520, overflowY: 'auto' }}>
          {conversations.length === 0 && (
            <p style={{ color: 'var(--text-dim)', fontSize: 13, padding: 12 }}>
              No conversations yet. Message someone from the Ideas page to start one.
            </p>
          )}
          {conversations.map((c) => (
            <div
              key={c.other_user_id}
              onClick={() => openThread(c)}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                background: active?.other_user_id === c.other_user_id ? 'var(--line)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 14 }}>{c.other_user_name}</strong>
                {c.unread_count > 0 && (
                  <span style={{ background: 'var(--brass, #b8894f)', color: '#fff', borderRadius: 10, fontSize: 11, padding: '1px 7px' }}>
                    {c.unread_count}
                  </span>
                )}
              </div>
              {c.idea_title && <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>re: {c.idea_title}</div>}
              <div style={{ fontSize: 12.5, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.last_message}
              </div>
            </div>
          ))}
        </div>

        {/* Thread */}
        <div className="card" style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', maxHeight: 520 }}>
          {!active && (
            <p style={{ color: 'var(--text-dim)', margin: 'auto' }}>Select a conversation to start chatting.</p>
          )}
          {active && (
            <>
              <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10, marginBottom: 10 }}>
                <strong>{active.other_user_name}</strong>
                {active.idea_title && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>re: {active.idea_title}</div>}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                {thread.map((m) => {
                  const mine = m.sender_id === me?.id;
                  return (
                    <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                      <div style={{
                        background: mine ? 'var(--brass, #b8894f)' : 'var(--line)',
                        color: mine ? '#fff' : 'inherit',
                        padding: '8px 12px', borderRadius: 12,
                        borderBottomRightRadius: mine ? 2 : 12,
                        borderBottomLeftRadius: mine ? 12 : 2,
                        fontSize: 14,
                      }}>
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  style={{ flex: 1, padding: '9px 13px', borderRadius: 8, border: '1.5px solid var(--line)' }}
                />
                <button type="submit" className="btn btn-brass" disabled={sending || !text.trim()}>Send</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
