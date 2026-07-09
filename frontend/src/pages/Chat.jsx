import { useEffect, useRef, useState } from 'react';
import api from '../api/client';

const ROLE_COLORS = { alumni: 'var(--brass)', student: 'var(--teal)', company: 'var(--coral, #E76F51)' };

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.get('/chat/history');
        if (!cancelled) setMessages(res.data);
      } catch {
        // ignore, chat just starts empty
      }

      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const wsBase = apiBase.replace(/^http/, 'ws');
      const ws = new WebSocket(`${wsBase}/chat/ws?token=${token}`);

      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        setMessages((prev) => [...prev, msg]);
      };

      wsRef.current = ws;
    })();

    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ content }));
    setText('');
  };

  return (
    <div className="page" style={{ paddingTop: 32, maxWidth: 680 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ fontSize: 26 }}>Community chat</h2>
        <span style={{ fontSize: 12.5, color: connected ? 'var(--teal)' : 'var(--text-dim)' }}>
          {connected ? '● Live' : '○ Connecting…'}
        </span>
      </div>

      <div className="card" style={{ height: 480, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
          {messages.length === 0 && (
            <p style={{ color: 'var(--text-dim)', fontSize: 14, textAlign: 'center', marginTop: 40 }}>
              No messages yet — say hello 👋
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: ROLE_COLORS[m.sender_role] || 'var(--ink)' }}>
                  {m.sender_name}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {m.sender_role}
                </span>
              </div>
              <div style={{ fontSize: 14.5, marginTop: 2 }}>{m.content}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--line)', padding: 12 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            style={{ flex: 1, padding: '10px 13px', borderRadius: 8, border: '1.5px solid var(--line)' }}
          />
          <button className="btn btn-brass" type="submit" disabled={!connected}>Send</button>
        </form>
      </div>
    </div>
  );
}
