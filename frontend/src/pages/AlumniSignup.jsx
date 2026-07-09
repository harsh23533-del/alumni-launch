import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AlumniSignup() {
  const navigate = useNavigate();
  const { signupAlumni } = useAuth();

  const [step, setStep] = useState('email'); // 'email' -> 'details'
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', name: '', batch: '', branch: '',
    company: '', designation: '', linkedin_url: '', phone: '',
  });

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email) return;
    setChecking(true);
    try {
      const res = await api.get('/auth/check-alumni-email', { params: { email: form.email } });
      setCheckResult(res.data);
      if (res.data.is_claimed) {
        setError('This email is already registered. Please log in instead.');
        setChecking(false);
        return;
      }
      setStep('details');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signupAlumni(form);
      navigate('/alumni/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 480, paddingTop: 40 }}>
      <h2 style={{ fontSize: 28, marginBottom: 6 }}>Alumni sign up</h2>
      <p style={{ color: 'var(--text-dim)', fontSize: 14.5, marginBottom: 24 }}>
        Post the startup you're building and find students to join it.
      </p>

      {error && <div className="error-banner">{error}</div>}

      {checkResult && !checkResult.is_claimed && checkResult.exists_in_import && (
        <div className="claim-banner">{checkResult.message}</div>
      )}

      {step === 'email' && (
        <form className="card" onSubmit={handleCheckEmail}>
          <div className="field">
            <label htmlFor="email">College or work email</label>
            <input id="email" type="email" required value={form.email} onChange={update('email')} placeholder="you@example.com" />
            <div className="helper-text">We'll check if you're already in our alumni records.</div>
          </div>
          <button className="btn btn-brass" type="submit" disabled={checking} style={{ width: '100%' }}>
            {checking ? 'Checking…' : 'Continue'}
          </button>
        </form>
      )}

      {step === 'details' && (
        <form className="card" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="password">Set a password</label>
            <input id="password" type="password" required minLength={6} value={form.password} onChange={update('password')} />
          </div>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" required value={form.name} onChange={update('name')}
              placeholder={checkResult?.exists_in_import ? 'Confirm your name' : ''} />
          </div>
          <div className="row-2">
            <div className="field">
              <label htmlFor="batch">Graduating batch</label>
              <input id="batch" value={form.batch} onChange={update('batch')} placeholder="2022" />
            </div>
            <div className="field">
              <label htmlFor="branch">Branch</label>
              <input id="branch" value={form.branch} onChange={update('branch')} placeholder="CSE" />
            </div>
          </div>
          <div className="row-2">
            <div className="field">
              <label htmlFor="company">Current company</label>
              <input id="company" value={form.company} onChange={update('company')} />
            </div>
            <div className="field">
              <label htmlFor="designation">Designation</label>
              <input id="designation" value={form.designation} onChange={update('designation')} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="linkedin_url">LinkedIn URL</label>
            <input id="linkedin_url" value={form.linkedin_url} onChange={update('linkedin_url')} placeholder="https://linkedin.com/in/…" />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone (optional)</label>
            <input id="phone" value={form.phone} onChange={update('phone')} />
          </div>
          <button className="btn btn-brass" type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Creating your account…' : (checkResult?.exists_in_import ? 'Claim my profile' : 'Create account')}
          </button>
        </form>
      )}

      <p style={{ marginTop: 18, fontSize: 14, color: 'var(--text-dim)', textAlign: 'center' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--ink)', fontWeight: 600 }}>Log in</Link>
      </p>
    </div>
  );
}
