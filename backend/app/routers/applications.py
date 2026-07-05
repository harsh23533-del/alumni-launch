import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_alumni, require_student
from app.models.models import Application, ApplicationStatus, Startup, User
from app.schemas.schemas import ApplicationOut, ApplicationStatusUpdate

router = APIRouter(prefix="/applications", tags=["applications"])

RESUME_DIR = "uploads/resumes"
os.makedirs(RESUME_DIR, exist_ok=True)


@router.post("", response_model=ApplicationOut)
async def apply_to_startup(
    startup_id: str = Form(...),
    message: str = Form(None),
    resume: UploadFile = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_student),
):
    startup = db.query(Startup).filter(Startup.id == startup_id, Startup.is_active == True).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found or no longer active")

    existing = (
        db.query(Application)
        .filter(Application.startup_id == startup_id, Application.student_id == user.student_profile.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You've already applied to this startup")

    resume_url = user.student_profile.resume_url  # default to profile resume
    if resume:
        ext = os.path.splitext(resume.filename)[1]
        filename = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join(RESUME_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(await resume.read())
        resume_url = filepath

    application = Application(
        startup_id=startup_id,
        student_id=user.student_profile.id,
        message=message,
        resume_url=resume_url,
        status=ApplicationStatus.pending,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("/mine", response_model=List[ApplicationOut])
def my_applications(db: Session = Depends(get_db), user: User = Depends(require_student)):
    """Applications the logged-in student has sent out."""
    return db.query(Application).filter(Application.student_id == user.student_profile.id).all()


@router.get("/for-startup/{startup_id}", response_model=List[ApplicationOut])
def applications_for_startup(
    startup_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_alumni),
):
    """Alumni views applicants for one of their own startup postings."""
    startup = db.query(Startup).filter(Startup.id == startup_id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    if startup.alumni_id != user.alumni_profile.id:
        raise HTTPException(status_code=403, detail="Not your startup posting")

    return db.query(Application).filter(Application.startup_id == startup_id).all()


@router.patch("/{application_id}/status", response_model=ApplicationOut)
def update_application_status(
    application_id: str,
    payload: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_alumni),
):
    """Alumni accepts or rejects a student's application."""
    if payload.status not in ("accepted", "rejected"):
        raise HTTPException(status_code=400, detail="status must be 'accepted' or 'rejected'")

    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    startup = db.query(Startup).filter(Startup.id == application.startup_id).first()
    if startup.alumni_id != user.alumni_profile.id:
        raise HTTPException(status_code=403, detail="Not your startup posting")

    application.status = ApplicationStatus(payload.status)
    db.commit()
    db.refresh(application)
    return application
