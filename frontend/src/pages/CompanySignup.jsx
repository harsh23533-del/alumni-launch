import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CompanySignup() {
  const navigate = useNavigate();
  const { signupCompany } = useAuth();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', company_name: '', website: '', industry: '', description: '' });

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signupCompany(form);
      navigate('/jobs/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 480, paddingTop: 40 }}>
      <h2 style={{ fontSize: 28, marginBottom: 6 }}>Company sign up</h2>
      <p style={{ color: 'var(--text-dim)', fontSize: 14.5, marginBottom: 24 }}>
        Post jobs and internships for students to apply to.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Work email</label>
          <input id="email" type="email" required value={form.email} onChange={update('email')} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required minLength={6} value={form.password} onChange={update('password')} />
        </div>
        <div className="field">
          <label htmlFor="company_name">Company name</label>
          <input id="company_name" required value={form.company_name} onChange={update('company_name')} />
        </div>
        <div className="row-2">
          <div className="field">
            <label htmlFor="website">Website</label>
            <input id="website" value={form.website} onChange={update('website')} placeholder="https://" />
          </div>
          <div className="field">
            <label htmlFor="industry">Industry</label>
            <input id="industry" value={form.industry} onChange={update('industry')} placeholder="Fintech" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="description">About the company</label>
          <textarea id="description" rows={3} value={form.description} onChange={update('description')} />
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
