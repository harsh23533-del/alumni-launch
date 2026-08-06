import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.database import Base, engine, sync_missing_columns
from app.routers import auth, import_data, startups, applications, profiles, jobs, notifications, chat, ideas, messages, reactions
from app.admin import router as admin

# Creates tables if they don't exist yet (fine for dev; use Alembic migrations for production)
Base.metadata.create_all(bind=engine)
sync_missing_columns()

app = FastAPI(title="AlumniLaunch API", version="1.0.0")

# Comma-separated list of allowed frontend origins, e.g. "https://alumni-launch.netlify.app"
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
origins = ["*"] if allowed_origins == "*" else [o.strip() for o in allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # An exception that escapes a route unhandled skips CORSMiddleware
    # entirely (Starlette quirk), so the browser reports "blocked by CORS
    # policy" and hides the real error. Turning it into a normal JSON
    # response here keeps it inside the middleware stack, so CORS headers
    # still get added and the frontend sees the actual error text.
    return JSONResponse(status_code=500, content={"detail": f"Server error: {exc}"})

# uploads/resumes isn't tracked by git (empty dirs aren't), so create it
# on startup or the StaticFiles mount below crashes the app immediately.
os.makedirs("uploads/resumes", exist_ok=True)
os.makedirs("uploads/idea_posters", exist_ok=True)
os.makedirs("uploads/idea_documents", exist_ok=True)
os.makedirs("uploads/idea_voice_notes", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(import_data.router)
app.include_router(startups.router)
app.include_router(applications.router)
app.include_router(profiles.router)
app.include_router(admin.router)
app.include_router(jobs.router)
app.include_router(notifications.router)
app.include_router(chat.router)
app.include_router(ideas.router)
app.include_router(messages.router)
app.include_router(reactions.router)


@app.get("/")
def root():
    return {"status": "AlumniLaunch API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
