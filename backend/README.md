# AlumniLaunch — Backend

FastAPI + PostgreSQL backend for an alumni-student startup networking platform.

## Features implemented

1. **SQL/CSV import** — `POST /import/csv` or `POST /import/sql` to bulk-load existing alumni records as *unclaimed* profiles.
2. **Pre-registration detection** — `GET /auth/check-alumni-email?email=...` tells the frontend whether this alumni already exists in imported data before showing the signup form.
3. **Claim-on-signup** — `POST /auth/signup/alumni` automatically links a new signup to the matching unclaimed imported record instead of creating a duplicate.
4. **Student signup** — `POST /auth/signup/student`.
5. **Startup posting** — Alumni can post a startup idea with domain, stage, roles needed, skills required, paid/unpaid info (`POST /startups`).
6. **Browse startups** — Public listing for students (`GET /startups`).
7. **Apply with resume** — Students apply with resume + "I will join if accepted" message (`POST /applications`, multipart form with optional resume file).
8. **Accept/Reject** — Alumni reviews applicants and accepts/rejects (`PATCH /applications/{id}/status`).

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set your PostgreSQL DATABASE_URL and a random SECRET_KEY

# create the database first (one time):
# createdb alumnilaunch   (or use pgAdmin / psql)

uvicorn app.main:app --reload
```

API docs auto-generated at: **http://localhost:8000/docs**

## Importing your existing alumni data

**CSV** (simplest, recommended): file with header row
```
email,name,batch,branch,company,designation,linkedin_url,phone
```
Upload via `/docs` → `POST /import/csv`, or:
```bash
curl -X POST http://localhost:8000/import/csv -F "file=@alumni.csv"
```

**SQL file**: if you have a `.sql` dump with `INSERT INTO ... VALUES (...)` statements matching similar columns, use `POST /import/sql`. Note: this uses a lightweight regex parser meant for simple dumps. For large/complex dumps (multiple tables, foreign keys, custom types), it's more reliable to restore the dump directly into Postgres with `psql -d alumnilaunch -f dump.sql` and then adjust the table name in the import script to match — ping me if you want that version instead.

## How the "already registered" flow works

1. You import alumni data → each row becomes an `AlumniProfile` with `is_claimed=False`, no linked `User` yet.
2. Frontend calls `check-alumni-email` before showing the signup form.
   - If `is_claimed=False` and record exists → show "We found you! Set a password to claim your profile" (pre-filled name/company etc.)
   - If `is_claimed=True` → show "Already registered, please log in"
   - If no record → show normal blank signup form
3. On signup, backend auto-detects and links the account — no duplicate profiles.

## Project structure

```
app/
  core/       -> database, security (JWT/bcrypt), auth dependency
  models/     -> SQLAlchemy models (User, AlumniProfile, StudentProfile, Startup, Application)
  schemas/    -> Pydantic request/response schemas
  routers/    -> auth, import_data, startups, applications, profiles
  main.py     -> FastAPI app entrypoint
uploads/resumes/  -> uploaded resume files stored here
```

## Next steps (not built yet)

- Frontend (React + Vite) — signup/login pages, startup feed, application dashboard
- Email notifications on accept/reject
- Alembic migrations (currently using `create_all` which is fine for dev only)
