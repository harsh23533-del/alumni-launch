import { useNavigate } from 'react-router-dom';

export default function SignupChoice() {
  const navigate = useNavigate();

  return (
    <div className="page" style={{ maxWidth: 560, paddingTop: 60 }}>
      <h2 style={{ fontSize: 28, marginBottom: 24, textAlign: 'center' }}>Who are you signing up as?</h2>
      <div className="row-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <button
          className="card"
          style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit', width: '100%' }}
          onClick={() => navigate('/signup/alumni')}
        >
          <h3 style={{ fontSize: 19 }}>Alumnus</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 8 }}>Post a startup or job and find students to join it.</p>
        </button>
        <button
          className="card"
          style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit', width: '100%' }}
          onClick={() => navigate('/signup/student')}
        >
          <h3 style={{ fontSize: 19 }}>Student</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 8 }}>Browse startups and jobs, apply with your resume.</p>
        </button>
        <button
          className="card"
          style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit', width: '100%' }}
          onClick={() => navigate('/signup/company')}
        >
          <h3 style={{ fontSize: 19 }}>Company</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 8 }}>Post jobs and internships for students.</p>
        </button>
      </div>
    </div>
  );
}
