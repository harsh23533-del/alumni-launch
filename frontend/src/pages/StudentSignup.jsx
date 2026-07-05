import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StudentSignup() {
  const navigate = useNavigate();
  const { signupStudent } = useAuth();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', branch: '', year: '', skills: '' });

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signupStudent(form);
      navigate('/startups');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 480, paddingTop: 40 }}>
      <h2 style={{ fontSize: 28, marginBottom: 6 }}>Student sign up</h2>
      <p style={{ color: 'var(--text-dim)', fontSize: 14.5, marginBottom: 24 }}>
        Browse startups alumni are building and apply directly.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={update('email')} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required minLength={6} value={form.password} onChange={update('password')} />
        </div>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" required value={form.name} onChange={update('name')} />
        </div>
        <div className="row-2">
          <div className="field">
            <label htmlFor="branch">Branch</label>
            <input id="branch" value={form.branch} onChange={update('branch')} placeholder="CSE" />
          </div>
          <div className="field">
            <label htmlFor="year">Year</label>
            <input id="year" value={form.year} onChange={update('year')} placeholder="3rd year" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="skills">Skills</label>
          <input id="skills" value={form.skills} onChange={update('skills')} placeholder="Python, React, SQL" />
          <div className="helper-text">Comma separated — helps alumni understand your fit.</div>
        </div>
        <button className="btn btn-brass" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Creating your account…' : 'Create account'}
        </button>
      </form>

      <p style={{ marginTop: 18, fontSize: 14, color: 'var(--text-dim)', textAlign: 'center' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--ink)', fontWeight: 600 }}>Log in</Link>
      </p>
    </div>
  );
}
