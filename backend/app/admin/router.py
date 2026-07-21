"""
Dedicated admin module.

This is separate from the normal /auth flow on purpose: the admin does NOT
sign up like alumni/student/company. An admin account is just a User row
whose email matches ADMIN_EMAIL (see app/core/security.py). This router
gives that account:
  - its own login endpoint (/admin/login) instead of sharing /auth/login
  - a dashboard summary
  - read access to every table (students, alumni, companies, startups,
    jobs, applications) so the admin can see everything happening on the
    platform in one place.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.core.security import verify_password, create_access_token, is_admin_email
from app.models.models import (
    User,
    AlumniProfile,
    StudentProfile,
    CompanyProfile,
    Startup,
    Job,
    Application,
    JobApplication,
    StudentApprovalStatus,
)
from app.schemas.schemas import (
    LoginRequest,
    TokenResponse,
    PendingStudentOut,
    StudentProfileOut,
    AlumniProfileOut,
    CompanyProfileOut,
    StartupOut,
    JobOut,
    ApplicationOut,
    JobApplicationOut,
)
from app.admin.schemas import AdminDashboardOut, AdminStudentOut
from app.utils.notify import notify_user

router = APIRouter(prefix="/admin", tags=["admin"])


# ---------- Auth (separate from the normal /auth/login) ----------

@router.post("/login", response_model=TokenResponse)
def admin_login(payload: LoginRequest, db: Session = Depends(get_db)):
    if not is_admin_email(payload.email):
        raise HTTPException(status_code=403, detail="This account is not an admin account.")

    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid admin email or password")

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenResponse(access_token=token, role=user.role.value, is_admin=True)


# ---------- Dashboard ----------

@router.get("/dashboard", response_model=AdminDashboardOut)
def dashboard(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return AdminDashboardOut(
        total_students=db.query(StudentProfile).count(),
        pending_students=db.query(StudentProfile)
        .filter(StudentProfile.approval_status == StudentApprovalStatus.pending)
        .count(),
        total_alumni=db.query(AlumniProfile).count(),
        claimed_alumni=db.query(AlumniProfile).filter(AlumniProfile.is_claimed == True).count(),  # noqa: E712
        total_companies=db.query(CompanyProfile).count(),
        total_startups=db.query(Startup).count(),
        total_jobs=db.query(Job).count(),
        total_startup_applications=db.query(Application).count(),
        total_job_applications=db.query(JobApplication).count(),
    )


# ---------- Students ----------

@router.get("/students", response_model=List[AdminStudentOut])
def list_all_students(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(StudentProfile).order_by(StudentProfile.created_at.desc()).all()
    return [
        AdminStudentOut(
            id=r.id,
            user_id=r.user_id,
            email=r.user.email,
            name=r.name,
            branch=r.branch,
            year=r.year,
            skills=r.skills,
            approval_status=r.approval_status.value,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/students/pending", response_model=List[PendingStudentOut])
def list_pending_students(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = (
        db.query(StudentProfile)
        .filter(StudentProfile.approval_status == StudentApprovalStatus.pending)
        .order_by(StudentProfile.created_at.desc())
        .all()
    )
    out = []
    for r in rows:
        out.append(
            PendingStudentOut(
                id=r.id,
                user_id=r.user_id,
                email=r.user.email,
                name=r.name,
                branch=r.branch,
                year=r.year,
                created_at=r.created_at,
            )
        )
    return out


@router.post("/students/{student_id}/approve")
def approve_student(student_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    profile = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    profile.approval_status = StudentApprovalStatus.approved
    db.commit()

    notify_user(
        db, profile.user_id,
        title="You're approved!",
        message="Your student account has been approved. You can now log in.",
        link="/login",
    )
    return {"status": "approved"}


@router.post("/students/{student_id}/reject")
def reject_student(student_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    profile = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    profile.approval_status = StudentApprovalStatus.rejected
    db.commit()

    notify_user(
        db, profile.user_id,
        title="Signup request rejected",
        message="Your student signup request was rejected by the admin.",
    )
    return {"status": "rejected"}


# ---------- Alumni ----------

@router.get("/alumni", response_model=List[AlumniProfileOut])
def list_all_alumni(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(AlumniProfile).order_by(AlumniProfile.created_at.desc()).all()
    return rows


# ---------- Companies ----------

@router.get("/companies", response_model=List[CompanyProfileOut])
def list_all_companies(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(CompanyProfile).order_by(CompanyProfile.created_at.desc()).all()
    return rows


# ---------- Startups ----------

@router.get("/startups", response_model=List[StartupOut])
def list_all_startups(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(Startup).order_by(Startup.created_at.desc()).all()
    return rows


# ---------- Jobs ----------

@router.get("/jobs", response_model=List[JobOut])
def list_all_jobs(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(Job).order_by(Job.created_at.desc()).all()
    out = []
    for j in rows:
        posted_by_name = None
        posted_by_type = None
        if j.alumni:
            posted_by_name = j.alumni.name
            posted_by_type = "alumni"
        elif j.company:
            posted_by_name = j.company.company_name
            posted_by_type = "company"
        out.append(
            JobOut(
                id=j.id, title=j.title, job_type=j.job_type.value, location=j.location,
                description=j.description, skills_required=j.skills_required,
                stipend_or_salary=j.stipend_or_salary, apply_link=j.apply_link,
                is_active=j.is_active, created_at=j.created_at,
                posted_by_name=posted_by_name, posted_by_type=posted_by_type,
            )
        )
    return out


# ---------- Applications ----------

@router.get("/applications", response_model=List[ApplicationOut])
def list_all_applications(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(Application).order_by(Application.created_at.desc()).all()
    return rows


@router.get("/job-applications", response_model=List[JobApplicationOut])
def list_all_job_applications(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(JobApplication).order_by(JobApplication.created_at.desc()).all()
    return rows
