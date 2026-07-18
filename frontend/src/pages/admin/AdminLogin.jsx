import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await loginAdmin(form.email, form.password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid admin email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 420, paddingTop: 60 }}>
      <h2 style={{ fontSize: 28, marginBottom: 6 }}>Admin login</h2>
      <p style={{ color: 'var(--text-dim)', fontSize: 14.5, marginBottom: 24 }}>
        This is a separate login just for the platform admin — alumni, student and
        company accounts can't use this form.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="admin-email">Admin email</label>
          <input id="admin-email" type="email" required value={form.email} onChange={update('email')} />
        </div>
        <div className="field">
          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" type="password" required value={form.password} onChange={update('password')} />
        </div>
        <button className="btn btn-brass" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Logging in…' : 'Log in as admin'}
        </button>
      </form>
    </div>
  );
}
