import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div style={{ padding: '64px 0 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brass)', marginBottom: 14 }}>
          For alumni & students
        </div>
        <h1 style={{ fontSize: 48, lineHeight: 1.15, maxWidth: 680, margin: '0 auto' }}>
          Where alumni startups find their first hires.
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text-dim)', maxWidth: 520, margin: '20px auto 0', lineHeight: 1.6 }}>
          Alumni post the startup they're building and who they need.
          Students apply directly with a resume. No middle steps.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 32 }}>
          <button className="btn btn-brass" style={{ padding: '13px 26px', fontSize: 15.5 }} onClick={() => navigate('/signup/alumni')}>
            I'm an alumnus — post a startup
          </button>
          <button className="btn btn-ghost" style={{ padding: '13px 26px', fontSize: 15.5 }} onClick={() => navigate('/signup/student')}>
            I'm a student — find a role
          </button>
        </div>
      </div>

      <div className="row-2" style={{ marginTop: 48 }}>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--brass)', marginBottom: 4 }}>01</div>
          <h3 style={{ fontSize: 19 }}>Already in our records?</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: 14.5, marginTop: 8, lineHeight: 1.6 }}>
            If your college has shared alumni data with us, we'll recognise your email
            the moment you sign up — you just set a password to claim your profile.
          </p>
        </div>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--brass)', marginBottom: 4 }}>02</div>
          <h3 style={{ fontSize: 19 }}>Post once, review at your pace</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: 14.5, marginTop: 8, lineHeight: 1.6 }}>
            Describe your startup, the stage it's at, and the roles you need filled.
            Applications with resumes land in one dashboard for you to accept or decline.
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/startups')}>
          Browse open startups without an account →
        </button>
      </div>
    </div>
  );
}
