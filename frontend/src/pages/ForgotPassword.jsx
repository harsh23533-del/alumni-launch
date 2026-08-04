import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import usePageTitle from '../hooks/usePageTitle';
import PasswordInput from '../components/PasswordInput';

export default function ForgotPassword() {
  usePageTitle('Forgot Password');
  const navigate = useNavigate();

  const [step, setStep] = useState('email'); // 'email' -> 'reset' -> 'done'
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password/check', { email });
      if (data.found) {
        setStep('reset');
      } else {
        setError(data.message || 'No account found with this email.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password/reset', { email, new_password: newPassword });
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not reset password. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 420, paddingTop: 60 }}>
      <h2 style={{ fontSize: 28, marginBottom: 24 }}>Forgot password</h2>

      {error && <div className="error-banner">{error}</div>}

      {step === 'email' && (
        <form className="card" onSubmit={handleCheckEmail}>
          <p style={{ color: 'var(--text-dim)', fontSize: 14.5, marginBottom: 16 }}>
            Enter the email you signed up with. If we find an account, you can reset
            your password right away.
          </p>
          <div className="field">
            <label htmlFor="fp-email">Email</label>
            <input
              id="fp-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="btn btn-brass" type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Checking…' : 'Continue'}
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form className="card" onSubmit={handleReset}>
          <p style={{ color: 'var(--text-dim)', fontSize: 14.5, marginBottom: 16 }}>
            Account found for <strong>{email}</strong>. Set a new password below.
          </p>
          <div className="field">
            <label htmlFor="fp-new">New password</label>
            <PasswordInput
              id="fp-new"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="fp-confirm">Confirm new password</label>
            <PasswordInput
              id="fp-confirm"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-brass" type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="card">
          <p style={{ marginBottom: 16 }}>
            Your password has been reset. You can log in with your new password now.
          </p>
          <button className="btn btn-brass" onClick={() => navigate('/login')} style={{ width: '100%' }}>
            Go to log in
          </button>
        </div>
      )}

      <p style={{ marginTop: 18, fontSize: 14, color: 'var(--text-dim)', textAlign: 'center' }}>
        Remembered it? <Link to="/login" style={{ color: 'var(--ink)', fontWeight: 600 }}>Log in</Link>
      </p>
    </div>
  );
}
