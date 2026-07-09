import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function PostJob() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', job_type: 'internship', location: '', description: '',
    skills_required: '', stipend_or_salary: '', apply_link: '',
  });

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/jobs', form);
      navigate('/jobs/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not post the job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 560, paddingTop: 40 }}>
      <h2 style={{ fontSize: 26, marginBottom: 6 }}>Post a job or internship</h2>
      <p style={{ color: 'var(--text-dim)', fontSize: 14.5, marginBottom: 24 }}>
        Students will see this in Browse jobs and can apply directly with their resume.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">Role title</label>
          <input id="title" required value={form.title} onChange={update('title')} placeholder="e.g. Backend Engineering Intern" />
        </div>

        <div className="row-2">
          <div className="field">
            <label htmlFor="job_type">Type</label>
            <select id="job_type" value={form.job_type} onChange={update('job_type')}>
              <option value="internship">Internship</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="location">Location</label>
            <input id="location" value={form.location} onChange={update('location')} placeholder="Remote / Bengaluru" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" value={form.description} onChange={update('description')}
            placeholder="What will they work on, who's the team, what's the process…" />
        </div>

        <div className="field">
          <label htmlFor="skills_required">Skills required</label>
          <input id="skills_required" value={form.skills_required} onChange={update('skills_required')}
            placeholder="React, Python, SQL" />
          <div className="helper-text">Comma separated.</div>
        </div>

        <div className="row-2">
          <div className="field">
            <label htmlFor="stipend_or_salary">Stipend / salary</label>
            <input id="stipend_or_salary" value={form.stipend_or_salary} onChange={update('stipend_or_salary')}
              placeholder="₹10k/month, or ₹6-8 LPA" />
          </div>
          <div className="field">
            <label htmlFor="apply_link">External apply link (optional)</label>
            <input id="apply_link" value={form.apply_link} onChange={update('apply_link')} placeholder="https://" />
          </div>
        </div>

        <button className="btn btn-brass" type="submit" disabled={submitting} style={{ width: '100%', marginTop: 8 }}>
          {submitting ? 'Posting…' : 'Post job'}
        </button>
      </form>
    </div>
  );
}
