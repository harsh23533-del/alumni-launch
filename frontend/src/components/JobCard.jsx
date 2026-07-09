import Seal from './Seal';

const TYPE_LABELS = { internship: 'Internship', full_time: 'Full-time', part_time: 'Part-time' };

export default function JobCard({ job, actionSlot }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--brass)' }}>
            {TYPE_LABELS[job.job_type] || job.job_type} {job.location ? `· ${job.location}` : ''}
          </div>
          <h3 style={{ fontSize: 22, marginTop: 6 }}>{job.title}</h3>
          <div style={{ fontSize: 13.5, color: 'var(--text-dim)', marginTop: 2 }}>
            Posted by {job.posted_by_name || 'Unknown'}
            {job.posted_by_type === 'company' ? ' (Company)' : ' (Alumnus)'}
          </div>
        </div>
        <Seal status={job.is_active ? 'open' : 'closed'} />
      </div>

      {job.description && (
        <p style={{ color: 'var(--text-dim)', fontSize: 14.5, lineHeight: 1.6, marginTop: 12 }}>
          {job.description}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        {job.skills_required && (
          <span style={{ fontSize: 13, background: 'var(--paper)', border: '1px solid var(--line)', padding: '5px 10px', borderRadius: 8 }}>
            Skills: {job.skills_required}
          </span>
        )}
        {job.stipend_or_salary && (
          <span style={{ fontSize: 13, background: 'var(--paper)', border: '1px solid var(--line)', padding: '5px 10px', borderRadius: 8 }}>
            {job.stipend_or_salary}
          </span>
        )}
      </div>

      {actionSlot && <div style={{ marginTop: 18 }}>{actionSlot}</div>}
    </div>
  );
}
