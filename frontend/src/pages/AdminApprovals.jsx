import { useEffect, useState } from 'react';
import api from '../api/client';

export default function AdminApprovals() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioning, setActioning] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/students/pending');
      setStudents(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load pending students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (studentId, action) => {
    setActioning(studentId);
    try {
      await api.post(`/admin/students/${studentId}/${action}`);
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err) {
      setError(err.response?.data?.detail || `Could not ${action} this student.`);
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="page" style={{ paddingTop: 32, maxWidth: 720 }}>
      <h2 style={{ fontSize: 26, marginBottom: 6 }}>Pending student approvals</h2>
      <p style={{ color: 'var(--text-dim)', fontSize: 14.5, marginBottom: 24 }}>
        Only @knit.ac.in signups land here. Approve to let them log in.
      </p>

      {error && <div className="error-banner">{error}</div>}

      {loading && <p style={{ color: 'var(--text-dim)' }}>Loading…</p>}
      {!loading && students.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          No pending signups right now. 🎉
        </div>
      )}

      {students.map((s) => (
        <div key={s.id} className="card" style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: 18 }}>{s.name}</h3>
            <div style={{ fontSize: 13.5, color: 'var(--text-dim)', marginTop: 4 }}>
              {s.email} {s.branch ? `· ${s.branch}` : ''} {s.year ? `· ${s.year}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-brass"
              disabled={actioning === s.id}
              onClick={() => act(s.id, 'approve')}
            >
              Approve
            </button>
            <button
              className="btn btn-danger"
              disabled={actioning === s.id}
              onClick={() => act(s.id, 'reject')}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
