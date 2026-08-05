import os

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.cloudinary_config import upload_to_cloudinary
from app.core.database import get_db
from app.core.deps import get_current_user, require_student
from app.models.models import User
from app.schemas.schemas import AlumniProfileOut, CompanyProfileOut, StudentProfileOut

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me")
def get_my_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == "alumni":
        return AlumniProfileOut.model_validate(user.alumni_profile)
    if user.role == "company":
        return CompanyProfileOut.model_validate(user.company_profile)
    return StudentProfileOut.model_validate(user.student_profile)


@router.post("/me/resume", response_model=StudentProfileOut)
async def upload_resume(
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_student),
):
    resume_url = upload_to_cloudinary(resume.file, folder="alumni_launch/resumes", resource_type="raw")

    user.student_profile.resume_url = resume_url
    db.commit()
    db.refresh(user.student_profile)
    return user.student_profile
