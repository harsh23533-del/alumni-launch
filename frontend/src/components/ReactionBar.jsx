import { useEffect, useRef, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

/**
 * Emoji reactions for a media item, sponsor, or idea. No fixed emoji set —
 * the "+" opens a plain text box, so whatever emoji is on the user's own
 * phone/OS keyboard works (tap the emoji key on mobile, Win+. or
 * Ctrl+Cmd+Space on desktop).
 */
export default function ReactionBar({ targetType, targetId }) {
  const { isAuthenticated } = useAuth();
  const [reactions, setReactions] = useState([]);
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    api.get('/reactions', { params: { target_type: targetType, target_id: targetId } })
      .then((res) => setReactions(res.data))
      .catch(() => {});
  }, [targetType, targetId]);

  useEffect(() => {
    if (picking) inputRef.current?.focus();
  }, [picking]);

  const toggle = async (emoji) => {
    if (!isAuthenticated) return;
    try {
      const res = await api.post('/reactions/toggle', { target_type: targetType, target_id: targetId, emoji });
      setReactions(res.data);
    } catch {
      // silently ignore — not worth interrupting the browsing flow
    }
  };

  const submitDraft = async (e) => {
    e.preventDefault();
    const emoji = draft.trim();
    setDraft('');
    setPicking(false);
    if (emoji) await toggle(emoji);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => toggle(r.emoji)}
          title={isAuthenticated ? 'Click to toggle your reaction' : 'Log in to react'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 9px',
            borderRadius: 20,
            fontSize: 13.5,
            cursor: isAuthenticated ? 'pointer' : 'default',
            border: r.reacted_by_me ? '1px solid var(--brass)' : '1px solid var(--line, rgba(255,255,255,0.15))',
            background: r.reacted_by_me ? 'rgba(59,220,196,0.12)' : 'transparent',
            color: 'inherit',
          }}
        >
          <span>{r.emoji}</span>
          <span style={{ fontSize: 11.5, opacity: 0.8 }}>{r.count}</span>
        </button>
      ))}

      {isAuthenticated && (
        picking ? (
          <form onSubmit={submitDraft} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => { if (!draft.trim()) setPicking(false); }}
              placeholder="😀"
              style={{
                width: 54,
                fontSize: 15,
                padding: '3px 8px',
                borderRadius: 20,
                border: '1px solid var(--line, rgba(255,255,255,0.15))',
                background: 'transparent',
                color: 'inherit',
              }}
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setPicking(true)}
            title="Add a reaction — use your keyboard's emoji key"
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: '1px solid var(--line, rgba(255,255,255,0.15))',
              background: 'transparent',
              color: 'inherit',
              fontSize: 14,
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            +
          </button>
        )
      )}
    </div>
  );
}
