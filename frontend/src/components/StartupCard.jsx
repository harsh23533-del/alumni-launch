import Seal from './Seal';

export default function StartupCard({ startup, actionSlot }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--brass)' }}>
            {startup.domain || 'General'} · {startup.stage || 'Idea stage'}
          </div>
          <h3 style={{ fontSize: 22, marginTop: 6 }}>{startup.title}</h3>
        </div>
        <Seal status={startup.is_active ? 'open' : 'closed'} />
      </div>

      {startup.description && (
        <p style={{ color: 'var(--text-dim)', fontSize: 14.5, lineHeight: 1.6, marginTop: 12 }}>
          {startup.description}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        {startup.roles_needed && (
          <span style={{ fontSize: 13, background: 'var(--paper)', border: '1px solid var(--line)', padding: '5px 10px', borderRadius: 8 }}>
            Roles: {startup.roles_needed}
          </span>
        )}
        {startup.team_size_needed && (
          <span style={{ fontSize: 13, background: 'var(--paper)', border: '1px solid var(--line)', padding: '5px 10px', borderRadius: 8 }}>
            Team size: {startup.team_size_needed}
          </span>
        )}
        <span style={{ fontSize: 13, background: 'var(--paper)', border: '1px solid var(--line)', padding: '5px 10px', borderRadius: 8 }}>
          {startup.is_paid ? (startup.compensation_details || 'Paid') : (startup.compensation_details || 'Unpaid / equity')}
        </span>
      </div>

      {actionSlot && <div style={{ marginTop: 18 }}>{actionSlot}</div>}
    </div>
  );
}
