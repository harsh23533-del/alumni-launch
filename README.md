# AlumniLaunch

Alumni-student platform: import existing alumni data, let alumni post startup ideas
and the roles they need, and let students apply directly with resumes.

```
alumnilaunch/
  backend/     -> FastAPI + PostgreSQL API (see backend/README.md)
  frontend/    -> React + Vite UI (see frontend/README.md)
```

## Quick start

**1. Backend**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DATABASE_URL + SECRET_KEY
uvicorn app.main:app --reload
```

**2. Frontend** (in a second terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:5173**. Backend docs at **http://localhost:8000/docs**.

## Suggested first run

1. Start backend + frontend.
2. Go to `/docs` on the backend and hit `POST /import/csv` with a small test CSV
   (columns: `email,name,batch,branch,company,designation,linkedin_url,phone`) to seed some alumni.
3. On the frontend, go to `/signup/alumni` and sign up with one of the emails you imported —
   you should see the "we found your profile" banner.
4. Post a startup from the alumni dashboard.
5. Sign up as a student in a different browser/incognito window, browse `/startups`, and apply.
6. Go back to the alumni account and accept/reject the application from the dashboard.

## What's built vs. what's next

**Built:** SQL/CSV import, pre-registration detection + claim-on-signup, alumni startup posting,
public browse + student apply with resume upload, alumni accept/reject dashboard.

**Not built yet (natural next steps):** email notifications on accept/reject, Alembic migrations
for production schema changes, editing a posted startup, student profile page to update resume
without re-applying.
