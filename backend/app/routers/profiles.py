import os
import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_student
from app.models.models import User
from app.schemas.schemas import AlumniProfileOut, StudentProfileOut

router = APIRouter(prefix="/profiles", tags=["profiles"])

RESUME_DIR = "uploads/resumes"
os.makedirs(RESUME_DIR, exist_ok=True)


@router.get("/me")
def get_my_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == "alumni":
        return AlumniProfileOut.model_validate(user.alumni_profile)
    return StudentProfileOut.model_validate(user.student_profile)


@router.post("/me/resume", response_model=StudentProfileOut)
async def upload_resume(
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_student),
):
    ext = os.path.splitext(resume.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(RESUME_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(await resume.read())

    user.student_profile.resume_url = filepath
    db.commit()
    db.refresh(user.student_profile)
    return user.student_profile
