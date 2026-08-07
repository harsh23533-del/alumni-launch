import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePageTitle from '../hooks/usePageTitle';
import IdeaGroupPanel from '../components/IdeaGroupPanel';
import ReactionBar from '../components/ReactionBar';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const fileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}/${path.replace(/\\/g, '/')}`;
};

function Stars({ value, onRate, readOnly }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => !readOnly && onRate && onRate(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          style={{
            cursor: readOnly ? 'default' : 'pointer',
            fontSize: 18,
            color: (hover || value) >= n ? 'var(--brass, #b8894f)' : 'var(--line)',
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function VoiceRecorder({ onRecorded, existingBlob }) {
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        setPreviewUrl(URL.createObjectURL(blob));
        onRecorded(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      alert('Could not access microphone. Please allow mic permission.');
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {!recording && (
        <button type="button" className="btn btn-ghost" onClick={start}>
          🎙️ Record voice pitch
        </button>
      )}
      {recording && (
        <button type="button" className="btn btn-danger" onClick={stop}>
          ⏹ Stop recording
        </button>
      )}
      {previewUrl && <audio controls src={previewUrl} style={{ height: 32, maxWidth: 220 }} />}
    </div>
  );
}

export default function Ideas() {
  usePageTitle('Student Ideas', 'Browse ideas pitched by students — rate them and connect directly.');
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirement, setRequirement] = useState('');
  const [posterFile, setPosterFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [openIdea, setOpenIdea] = useState(null);
  const [myGroups, setMyGroups] = useState([]);

  const load = async () => {
    setLoading(true);
    const res = await api.get('/ideas');
    setIdeas(res.data);
    setLoading(false);
  };

  const loadMyGroups = async () => {
    if (role !== 'student') return;
    const res = await api.get('/ideas/groups/mine').catch(() => ({ data: [] }));
    setMyGroups(res.data);
  };

  useEffect(() => { load(); loadMyGroups(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId) return;
    api.get(`/ideas/${openId}`)
      .then((res) => setOpenIdea(res.data))
      .catch(() => {})
      .finally(() => {
        setSearchParams((prev) => {
          prev.delete('open');
          return prev;
        }, { replace: true });
      });
    // eslint-disable-next-line
  }, [searchParams]);

  const submitIdea = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('requirement', requirement);
      if (posterFile) formData.append('poster', posterFile);
      if (documentFile) formData.append('document', documentFile);
      if (voiceBlob) formData.append('voice_note', voiceBlob, 'pitch.webm');

      await api.post('/ideas', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormSuccess('Idea posted! Alumni and companies can now view and rate it.');
      setTitle(''); setDescription(''); setRequirement('');
      setPosterFile(null); setDocumentFile(null); setVoiceBlob(null);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Could not post your idea.');
    } finally {
      setSubmitting(false);
    }
  };

  const rate = async (ideaId, stars) => {
    try {
      await api.post(`/ideas/${ideaId}/rate`, { stars });
      load();
      if (openIdea?.id === ideaId) {
        const res = await api.get(`/ideas/${ideaId}`);
        setOpenIdea(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not submit rating.');
    }
  };

  const messageAuthor = (idea) => {
    if (!isAuthenticated) return navigate('/login');
    navigate('/messages', { state: { toUserId: idea.student_user_id, toName: idea.student_name, ideaId: idea.id, ideaTitle: idea.title } });
  };

  const canRate = isAuthenticated && (role === 'alumni' || role === 'company');

  return (
    <div className="page" style={{ paddingTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>💡</span> Student ideas
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 12.5 }}>
            Pitch your idea with a poster, document, or a voice note. Alumni and companies can rate it and message you directly.
          </p>
        </div>
        {role === 'student' && (
          <button className="btn btn-brass" onClick={() => { setShowForm((v) => !v); setFormSuccess(''); }}>
            {showForm ? 'Cancel' : '+ Post your idea'}
          </button>
        )}
      </div>

      {formSuccess && <div className="success-banner">{formSuccess}</div>}

      {role === 'student' && myGroups.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 16, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 18 }}>🧩</span> My groups
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {myGroups.map((g) => (
              <div
                key={g.id}
                className="card"
                style={{ padding: 14, cursor: 'pointer' }}
                onClick={() => setOpenIdea(g)}
              >
                <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>{g.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
                  {g.member_count} member{g.member_count === 1 ? '' : 's'} · by {g.student_name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          {formError && <div className="error-banner">{formError}</div>}
          <form onSubmit={submitIdea}>
            <div className="field">
              <label htmlFor="i-title">Idea title</label>
              <input id="i-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="i-desc">Describe your idea</label>
              <textarea id="i-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="i-req">What do you need? (mentorship, funding, a co-founder...)</label>
              <textarea id="i-req" value={requirement} onChange={(e) => setRequirement(e.target.value)} />
            </div>
            <div className="row-2">
              <div className="field">
                <label htmlFor="i-poster">Poster image (optional)</label>
                <input id="i-poster" type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files[0])} />
              </div>
              <div className="field">
                <label htmlFor="i-doc">Pitch document (optional)</label>
                <input id="i-doc" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(e) => setDocumentFile(e.target.files[0])} />
              </div>
            </div>
            <div className="field">
              <label>Voice pitch (optional)</label>
              <VoiceRecorder onRecorded={setVoiceBlob} />
            </div>
            <button type="submit" className="btn btn-brass" disabled={submitting} style={{ marginTop: 8 }}>
              {submitting ? 'Posting…' : 'Post idea'}
            </button>
          </form>
        </div>
      )}

      {loading && <p style={{ color: 'var(--text-dim)' }}>Loading ideas…</p>}
      {!loading && ideas.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          No ideas posted yet. Be the first!
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {ideas.map((idea) => (
          <div key={idea.id} className="card">
            <div style={{ display: 'flex', gap: 14 }}>
              {idea.poster_url && (
                <img
                  src={fileUrl(idea.poster_url)}
                  alt=""
                  style={{ width: 84, height: 84, borderRadius: 10, objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }}
                  onClick={() => setOpenIdea(idea)}
                />
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, marginBottom: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setOpenIdea(idea)}>
                  <span style={{ fontSize: 18 }}>💡</span> {idea.title}
                </h3>
                <p style={{ color: 'var(--text-dim)', fontSize: 12.5 }}>👤 by {idea.student_name}</p>
                <p style={{ fontSize: 13, marginTop: 6, maxWidth: 640 }}>{idea.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                  <Stars value={idea.avg_rating} readOnly />
                  <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
                    {idea.avg_rating > 0 ? `${idea.avg_rating} (${idea.ratings_count})` : 'No ratings yet'}
                  </span>
                  {idea.voice_note_url && <span style={{ fontSize: 12.5 }}>🎙️ voice pitch available</span>}
                  {idea.document_url && <span style={{ fontSize: 12.5 }}>📄 document attached</span>}
                </div>
                <div style={{ marginTop: 10 }}>
                  <ReactionBar targetType="idea" targetId={idea.id} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                {role !== 'student' && (
                  <button className="btn btn-ghost" onClick={() => messageAuthor(idea)}>Message</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {openIdea && (
        <div style={overlayStyle} onClick={() => setOpenIdea(null)}>
          <div className="card" style={{ maxWidth: 520, width: '100%', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            {openIdea.poster_url && (
              <img src={fileUrl(openIdea.poster_url)} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 14, objectFit: 'cover', maxHeight: 260 }} />
            )}
            <h3 style={{ fontSize: 20 }}>{openIdea.title}</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 10 }}>by {openIdea.student_name}</p>
            <p style={{ fontSize: 14, marginBottom: 10 }}>{openIdea.description}</p>
            {openIdea.requirement && (
              <p style={{ fontSize: 14, marginBottom: 10 }}><strong>Looking for:</strong> {openIdea.requirement}</p>
            )}
            {openIdea.voice_note_url && (
              <div style={{ marginBottom: 10 }}>
                <audio controls src={fileUrl(openIdea.voice_note_url)} style={{ width: '100%' }} />
              </div>
            )}
            {openIdea.document_url && (
              <a href={fileUrl(openIdea.document_url)} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ marginBottom: 10, display: 'inline-block' }}>
                📄 View pitch document
              </a>
            )}

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Stars value={openIdea.avg_rating} readOnly />
                <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                  {openIdea.avg_rating > 0 ? `${openIdea.avg_rating} average (${openIdea.ratings_count} ratings)` : 'No ratings yet'}
                </span>
              </div>
              {canRate && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: 13, marginBottom: 4 }}>{openIdea.my_rating ? 'Your rating:' : 'Rate this idea:'}</p>
                  <Stars value={openIdea.my_rating || 0} onRate={(n) => rate(openIdea.id, n)} />
                </div>
              )}
            </div>

            {isAuthenticated && role === 'student' && <IdeaGroupPanel idea={openIdea} />}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setOpenIdea(null)} style={{ flex: 1 }}>Close</button>
              {role !== 'student' && (
                <button className="btn btn-brass" onClick={() => messageAuthor(openIdea)} style={{ flex: 1 }}>
                  Message {openIdea.student_name}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(22,33,62,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50,
};
