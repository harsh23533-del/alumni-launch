from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.database import Base, engine
from app.routers import auth, import_data, startups, applications, profiles

# Creates tables if they don't exist yet (fine for dev; use Alembic migrations for production)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AlumniLaunch API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(import_data.router)
app.include_router(startups.router)
app.include_router(applications.router)
app.include_router(profiles.router)


@app.get("/")
def root():
    return {"status": "AlumniLaunch API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
