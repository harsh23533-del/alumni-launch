from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.cloudinary_config import upload_to_cloudinary
from app.core.database import get_db
from app.core.deps import require_poster, require_student, get_current_user
from app.models.models import DirectMessage, Job, JobApplication, User, JobType, JobApplicationStatus
from app.schemas.schemas import (
    JobCreate, JobOut, JobApplicationOut, JobApplicationStatusUpdate, GovtJobTeaser,
)
from app.utils.notify import notify_admin, broadcast, notify_user

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _to_job_out(job: Job) -> JobOut:
    if job.is_government:
        posted_by_name = "Government"
        posted_by_type = "government"
    elif job.alumni_id:
        posted_by_name = job.alumni.name if job.alumni else None
        posted_by_type = "alumni"
    else:
        posted_by_name = job.company.company_name if job.company else None
        posted_by_type = "company"

    return JobOut(
        id=job.id,
        title=job.title,
        job_type=job.job_type.value if hasattr(job.job_type, "value") else job.job_type,
        location=job.location,
        description=job.description,
        skills_required=job.skills_required,
        stipend_or_salary=job.stipend_or_salary,
        apply_link=job.apply_link,
        is_active=job.is_active,
        is_government=job.is_government,
        eligibility=job.eligibility,
        created_at=job.created_at,
        posted_by_name=posted_by_name,
        posted_by_type=posted_by_type,
    )


@router.post("", response_model=JobOut)
def create_job(payload: JobCreate, db: Session = Depends(get_db), user: User = Depends(require_poster)):
    try:
        job_type = JobType(payload.job_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job_type. Use internship, full_time, or part_time.")

    job = Job(
        alumni_id=user.alumni_profile.id if user.role == "alumni" else None,
        company_id=user.company_profile.id if user.role == "company" else None,
        title=payload.title,
        job_type=job_type,
        location=payload.location,
        description=payload.description,
        skills_required=payload.skills_required,
        stipend_or_salary=payload.stipend_or_salary,
        apply_link=payload.apply_link,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    poster_name = user.alumni_profile.name if user.role == "alumni" else user.company_profile.company_name
    notify_admin(db, title="New job posted", message=f"{poster_name} posted: {job.title}", link="/jobs")
    broadcast(db, title="New job opening", message=f"{job.title} was just posted.", link="/jobs", exclude_user_id=user.id)

    return _to_job_out(job)


@router.get("", response_model=List[JobOut])
def list_jobs(job_type: Optional[str] = None, is_active: bool = True, db: Session = Depends(get_db)):
    # Government jobs live in their own section (see /jobs/government below) —
    # they're posted only from the admin panel and gated behind sign-in, so
    # keep them out of the regular alumni/company job listing entirely.
    query = db.query(Job).filter(Job.is_active == is_active, Job.is_government == False)  # noqa: E712
    if job_type:
        query = query.filter(Job.job_type == job_type)
    jobs = query.order_by(Job.created_at.desc()).all()
    return [_to_job_out(j) for j in jobs]


@router.get("/government", response_model=List[GovtJobTeaser])
def list_government_jobs(db: Session = Depends(get_db)):
    """Public — anyone (even signed out) can see that these exist and their
    title/eligibility, but not the description or apply link. Full details
    require /jobs/government/{id} with a valid sign-in."""
    jobs = db.query(Job).filter(Job.is_government == True, Job.is_active == True).order_by(Job.created_at.desc()).all()  # noqa: E712
    return jobs


@router.get("/government/{job_id}", response_model=JobOut)
def get_government_job(job_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Full details — requires sign-in (any role)."""
    job = db.query(Job).filter(Job.id == job_id, Job.is_government == True).first()  # noqa: E712
    if not job:
        raise HTTPException(status_code=404, detail="Government job not found")
    return _to_job_out(job)


@router.get("/mine", response_model=List[JobOut])
def my_jobs(db: Session = Depends(get_db), user: User = Depends(require_poster)):
    if user.role == "alumni":
        jobs = db.query(Job).filter(Job.alumni_id == user.alumni_profile.id).all()
    else:
        jobs = db.query(Job).filter(Job.company_id == user.company_profile.id).all()
    return [_to_job_out(j) for j in jobs]


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _to_job_out(job)


@router.patch("/{job_id}/close", response_model=JobOut)
def close_job(job_id: str, db: Session = Depends(get_db), user: User = Depends(require_poster)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    owns_it = (user.role == "alumni" and job.alumni_id == user.alumni_profile.id) or \
              (user.role == "company" and job.company_id == user.company_profile.id)
    if not owns_it:
        raise HTTPException(status_code=403, detail="Not your job posting")

    job.is_active = False
    db.commit()
    db.refresh(job)
    return _to_job_out(job)


# ---------- Applications ----------

@router.post("/apply", response_model=JobApplicationOut)
async def apply_to_job(
    job_id: str = Form(...),
    message: str = Form(None),
    resume: UploadFile = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_student),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job or not job.is_active:
        raise HTTPException(status_code=404, detail="Job not found or no longer active")

    existing = db.query(JobApplication).filter(
        JobApplication.job_id == job_id,
        JobApplication.student_id == user.student_profile.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You've already applied to this job")

    # Default to the resume already on file in the student's profile; a resume
    # uploaded here (any file type — pdf, screenshot, photo, whatever they have)
    # overrides it for this one application only.
    resume_url = user.student_profile.resume_url
    if resume is not None and resume.filename:
        resume_url = upload_to_cloudinary(resume.file, folder="alumni_launch/job_resumes", resource_type="auto")

    application = JobApplication(
        job_id=job_id,
        student_id=user.student_profile.id,
        message=message,
        resume_url=resume_url,
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    poster_user_id = job.alumni.user_id if job.alumni_id else job.company.user_id

    # Open a direct-message thread with the poster, same as the Ideas join-request
    # flow, so they can go back and forth a bit before the poster shortlists/rejects.
    db.add(DirectMessage(
        sender_id=user.id,
        receiver_id=poster_user_id,
        content=message or f"Hi! I just applied for {job.title}.",
    ))
    db.commit()

    notify_user(
        db, poster_user_id,
        title="New application received",
        message=f"{user.student_profile.name} applied for {job.title}",
        link="/jobs/dashboard",
    )
    return application


@router.get("/{job_id}/applications", response_model=List[JobApplicationOut])
def list_job_applications(job_id: str, db: Session = Depends(get_db), user: User = Depends(require_poster)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    owns_it = (user.role == "alumni" and job.alumni_id == user.alumni_profile.id) or \
              (user.role == "company" and job.company_id == user.company_profile.id)
    if not owns_it:
        raise HTTPException(status_code=403, detail="Not your job posting")

    apps = db.query(JobApplication).filter(JobApplication.job_id == job_id).all()
    out = []
    for a in apps:
        item = JobApplicationOut.model_validate(a)
        item.student_name = a.student.name if a.student else None
        item.student_user_id = a.student.user_id if a.student else None
        out.append(item)
    return out


@router.get("/applications/mine", response_model=List[JobApplicationOut])
def my_job_applications(db: Session = Depends(get_db), user: User = Depends(require_student)):
    return db.query(JobApplication).filter(JobApplication.student_id == user.student_profile.id).all()


@router.patch("/applications/{application_id}/status", response_model=JobApplicationOut)
def update_application_status(
    application_id: str,
    payload: JobApplicationStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_poster),
):
    application = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = application.job
    owns_it = (user.role == "alumni" and job.alumni_id == user.alumni_profile.id) or \
              (user.role == "company" and job.company_id == user.company_profile.id)
    if not owns_it:
        raise HTTPException(status_code=403, detail="Not your job posting")

    try:
        application.status = JobApplicationStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")

    db.commit()
    db.refresh(application)

    notify_user(
        db, application.student.user_id,
        title=f"Application {application.status.value}",
        message=f"Your application for {job.title} was marked as {application.status.value}.",
        link="/student/applications",
    )
    return application
