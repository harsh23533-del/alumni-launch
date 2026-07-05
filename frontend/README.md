# AlumniLaunch — Frontend

React + Vite frontend for the alumni-student startup platform.

## Setup

```bash
cd frontend
npm install
cp .env.example .env    # point VITE_API_URL at your running backend
npm run dev
```

Runs at **http://localhost:5173** by default. Make sure the backend (`../backend`) is running on the URL set in `.env`.

## Pages

| Route | Who | What |
|---|---|---|
| `/` | Everyone | Landing page |
| `/signup/alumni` | Alumni | Signup with automatic "claim your existing profile" detection |
| `/signup/student` | Students | Signup |
| `/login` | Everyone | Login |
| `/startups` | Everyone | Browse open startups (students apply here) |
| `/alumni/post` | Alumni | Post a new startup opportunity |
| `/alumni/dashboard` | Alumni | View own startups + review/accept/reject applicants |
| `/student/applications` | Students | Track status of applications sent |

## How the claim flow works in the UI

1. On `/signup/alumni`, the person first enters just their email.
2. Frontend calls `GET /auth/check-alumni-email`.
   - If a matching unclaimed import record exists, a banner says "We found your profile — claim it" and the form continues to password + details.
   - If already claimed, it tells them to log in instead.
   - If no record, it's a normal fresh signup.
3. Submitting the details form calls `POST /auth/signup/alumni`, which the backend links to the existing record automatically.

## Build for production

```bash
npm run build
```

Outputs static files to `dist/` — deploy to Netlify, Vercel, or any static host (you've done this before with the Healthcare AI Platform on Netlify).
