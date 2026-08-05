import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function IdeaGroupPanel({ idea }) {
  const { isAuthenticated, role, userId } = useAuth();
  const isOwner = isAuthenticated && userId === idea.student_user_id;

  const [myRequestStatus, setMyRequestStatus] = useState(null);
  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [inGroup, setInGroup] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      let memberOfGroup = false;
      if (isOwner) {
        const [reqRes, memRes] = await Promise.all([
          api.get(`/ideas/${idea.id}/join-requests`),
          api.get(`/ideas/${idea.id}/group/members`),
        ]);
        setRequests(reqRes.data);
        setMembers(memRes.data);
        memberOfGroup = true;
      } else if (role === 'student') {
        const memberCheck = await api.get(`/ideas/${idea.id}/group/members`).catch(() => null);
        if (memberCheck) {
          const mine = memberCheck.data.find((m) => m.requester_id === userId);
          memberOfGroup = !!mine;
          if (mine) setMyRequestStatus('accepted');
        }
      }
      setInGroup(memberOfGroup);
      if (isOwner || memberOfGroup) {
        const msgRes = await api.get(`/ideas/${idea.id}/group/messages`).catch(() => ({ data: [] }));
        setMessages(msgRes.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [idea.id]);

  const requestToJoin = async () => {
    try {
      await api.post(`/ideas/${idea.id}/join-requests`, {});
      setMyRequestStatus('pending');
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not send request.');
    }
  };

  const respond = async (requestId, action) => {
    await api.post(`/ideas/join-requests/${requestId}/${action}`);
    load();
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    const res = await api.post(`/ideas/${idea.id}/group/messages`, { content: text });
    setMessages((prev) => [...prev, res.data]);
    setText('');
  };

  if (role === 'alumni' || role === 'company') return null; // group is a student-only workspace

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
      <h4 style={{ fontSize: 14.5, marginBottom: 8 }}>Team</h4>

      {loading && <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Loading…</p>}

      {!loading && !isOwner && !inGroup && (
        <button
          className="btn btn-ghost"
          disabled={myRequestStatus === 'pending'}
          onClick={requestToJoin}
        >
          {myRequestStatus === 'pending' ? 'Request sent' : 'Request to join this team'}
        </button>
      )}

      {!loading && isOwner && (
        <>
          {requests.filter((r) => r.status === 'pending').length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 6 }}>Pending requests</p>
              {requests.filter((r) => r.status === 'pending').map((r) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13.5 }}>{r.requester_name}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-brass" style={{ padding: '4px 10px', fontSize: 12.5 }} onClick={() => respond(r.id, 'accept')}>Accept</button>
                    <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12.5 }} onClick={() => respond(r.id, 'reject')}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 6 }}>
            {members.length === 0 ? 'No accepted members yet' : `${members.length} member(s): ${members.map((m) => m.requester_name).join(', ')}`}
          </p>
        </>
      )}

      {(isOwner || inGroup) && (
        <div style={{ marginTop: 10 }}>
          <div style={{ maxHeight: 160, overflowY: 'auto', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {messages.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>No messages yet.</p>}
            {messages.map((m) => (
              <div key={m.id} style={{ fontSize: 13 }}>
                <strong>{m.sender_name}:</strong> {m.content}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Message the team…"
              style={{ flex: 1 }}
            />
            <button className="btn btn-brass" onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
