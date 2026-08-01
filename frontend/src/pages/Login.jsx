import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(form.email, form.password);
      if (data.is_admin) navigate('/admin/dashboard');
      else if (data.role === 'alumni') navigate('/alumni/dashboard');
      else if (data.role === 'company') navigate('/jobs/dashboard');
      else navigate('/startups');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 420, paddingTop: 60 }}>
      <h2 style={{ fontSize: 28, marginBottom: 24 }}>Log in</h2>

      {error && <div className="error-banner">{error}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={update('email')} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required value={form.password} onChange={update('password')} />
        </div>
        <button className="btn btn-brass" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p style={{ marginTop: 18, fontSize: 14, color: 'var(--text-dim)', textAlign: 'center' }}>
        New here? <Link to="/signup" style={{ color: 'var(--ink)', fontWeight: 600 }}>Sign up</Link>
      </p>
    </div>
  );
}
