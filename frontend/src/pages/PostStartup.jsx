import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function PostStartup() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', domain: '', stage: 'idea', description: '',
    roles_needed: '', skills_required: '', team_size_needed: '',
    is_paid: false, compensation_details: '',
  });

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        team_size_needed: form.team_size_needed ? parseInt(form.team_size_needed, 10) : null,
      };
      await api.post('/startups', payload);
      navigate('/alumni/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not post your startup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 560, paddingTop: 40 }}>
      <h2 style={{ fontSize: 26, marginBottom: 6 }}>Post your startup</h2>
      <p style={{ color: 'var(--text-dim)', fontSize: 14.5, marginBottom: 24 }}>
        Tell students what you're building and what kind of people you need.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">Startup name / working title</label>
          <input id="title" required value={form.title} onChange={update('title')} placeholder="e.g. FinLedger" />
        </div>

        <div className="row-2">
          <div className="field">
            <label htmlFor="domain">Domain</label>
            <input id="domain" value={form.domain} onChange={update('domain')} placeholder="Fintech, EdTech, AI/ML…" />
          </div>
          <div className="field">
            <label htmlFor="stage">Stage</label>
            <select id="stage" value={form.stage} onChange={update('stage')}>
              <option value="idea">Idea</option>
              <option value="mvp">MVP</option>
              <option value="early-revenue">Early revenue</option>
              <option value="funded">Funded</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="description">What are you building?</label>
          <textarea id="description" value={form.description} onChange={update('description')}
            placeholder="What problem does it solve, who's it for, why now…" />
        </div>

        <div className="field">
          <label htmlFor="roles_needed">Roles you need</label>
          <input id="roles_needed" value={form.roles_needed} onChange={update('roles_needed')}
            placeholder="Backend Dev, UI Designer, Growth Marketer" />
          <div className="helper-text">Comma separated.</div>
        </div>

        <div className="field">
          <label htmlFor="skills_required">Skills you're looking for</label>
          <input id="skills_required" value={form.skills_required} onChange={update('skills_required')}
            placeholder="React, Python, Figma" />
        </div>

        <div className="row-2">
          <div className="field">
            <label htmlFor="team_size_needed">Team size needed</label>
            <input id="team_size_needed" type="number" min="1" value={form.team_size_needed} onChange={update('team_size_needed')} />
          </div>
          <div className="field">
            <label htmlFor="compensation_details">Compensation</label>
            <input id="compensation_details" value={form.compensation_details} onChange={update('compensation_details')}
              placeholder="Equity only / ₹10k stipend + equity" />
          </div>
        </div>

        <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input id="is_paid" type="checkbox" style={{ width: 'auto' }} checked={form.is_paid} onChange={update('is_paid')} />
          <label htmlFor="is_paid" style={{ margin: 0 }}>This role is paid</label>
        </div>

        <button className="btn btn-brass" type="submit" disabled={submitting} style={{ width: '100%', marginTop: 8 }}>
          {submitting ? 'Posting…' : 'Post startup'}
        </button>
      </form>
    </div>
  );
}
