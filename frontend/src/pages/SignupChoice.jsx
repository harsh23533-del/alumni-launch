import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import TiltCard from '../components/TiltCard';

export default function SignupChoice() {
  usePageTitle('Sign Up', 'Join AlumniLaunch as an alumnus, student, or company.');
  const navigate = useNavigate();
  const options = [
    { role: 'alumni', title: 'Alumnus', desc: 'Post a startup or job and find students to join it.', img: '/images/signup-alumnus.webp' },
    { role: 'student', title: 'Student', desc: 'Browse startups and jobs, apply with your resume.', img: '/images/signup-student.webp' },
    { role: 'company', title: 'Company', desc: 'Post jobs and internships for students.', img: '/images/signup-company.webp' },
  ];
  return (
    <div className="page" style={{ maxWidth: 900, paddingTop: 60 }}>
      <h2 style={{ fontSize: 28, marginBottom: 24, textAlign: 'center' }}>Who are you signing up as?</h2>
      <div className="signup-grid" style={{ gap: 20 }}>
        {options.map((opt, i) => (
          <TiltCard
            as="button"
            key={opt.role}
            className={`card rise-in rise-in-${i + 1}`}
            style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit', width: '100%', padding: 0, overflow: 'hidden' }}
            onClick={() => navigate(`/signup/${opt.role}`)}
          >
            <img
              src={opt.img}
              alt=""
              aria-hidden="true"
              style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block', borderBottom: '1px solid var(--line)' }}
            />
            <div style={{ padding: 20 }}>
              <h3 style={{ fontSize: 19 }}>{opt.title}</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 8 }}>{opt.desc}</p>
            </div>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}