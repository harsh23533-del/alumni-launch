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

import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.core.cloudinary_config import upload_to_cloudinary
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
    ChatMessage,
    Notification,
    AdminMedia,
    Sponsor,
    HomepageVideo,
)
from app.schemas.schemas import (
    LoginRequest,
    TokenResponse,
    PendingStudentOut,
    StudentProfileOut,
    StartupOut,
    JobOut,
    ApplicationOut,
    JobApplicationOut,
)
from app.admin.schemas import AdminDashboardOut, AdminStudentOut, AdminAlumniOut, AdminCompanyOut, AdminMediaOut, SponsorOut, HomepageVideoOut
from app.utils.notify import notify_user

router = APIRouter(prefix="/admin", tags=["admin"])

MEDIA_DIR = "uploads/admin_media"
os.makedirs(MEDIA_DIR, exist_ok=True)


def _purge_user(db: Session, user_id: str):
    """
    Delete every row that references this user but is NOT reachable via a
    profile's own cascade="all, delete-orphan" relationship, then delete the
    User row itself. Call this AFTER the profile row has already been
    deleted (or flushed for deletion) so no FK still points at it.
    """
    if not user_id:
        return
    db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete(synchronize_session=False)
    db.query(Notification).filter(Notification.user_id == user_id).delete(synchronize_session=False)
    db.query(User).filter(User.id == user_id).delete(synchronize_session=False)


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
            resume_url=r.resume_url,
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


@router.delete("/students/{student_id}")
def delete_student(student_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    profile = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    user_id = profile.user_id
    # cascade="all, delete-orphan" on StudentProfile.applications/job_applications
    # takes care of Application + JobApplication rows for this student.
    db.delete(profile)
    db.flush()
    _purge_user(db, user_id)
    db.commit()
    return {"status": "deleted"}


# ---------- Alumni ----------

@router.get("/alumni", response_model=List[AdminAlumniOut])
def list_all_alumni(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(AlumniProfile).order_by(AlumniProfile.created_at.desc()).all()
    return [
        AdminAlumniOut(
            id=r.id,
            user_id=r.user_id,
            # r.email is the address used for signup-matching; if the row was
            # later claimed, r.user.email is the account's actual login email.
            email=(r.user.email if r.user else r.email),
            name=r.name,
            batch=r.batch,
            branch=r.branch,
            company=r.company,
            designation=r.designation,
            linkedin_url=r.linkedin_url,
            phone=r.phone,
            is_claimed=r.is_claimed,
            imported=r.imported,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.delete("/alumni/{alumni_id}")
def delete_alumni(alumni_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    profile = db.query(AlumniProfile).filter(AlumniProfile.id == alumni_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Alumni profile not found")

    user_id = profile.user_id  # may be None if this row was imported and never claimed

    # Jobs posted directly by this alumni aren't reachable via AlumniProfile's
    # own relationships (only Startup is), so delete them explicitly first —
    # each Job's own cascade="all, delete-orphan" clears its JobApplications.
    jobs = db.query(Job).filter(Job.alumni_id == alumni_id).all()
    for job in jobs:
        db.delete(job)

    # cascade="all, delete-orphan" on AlumniProfile.startups takes care of
    # Startup rows and, via Startup.applications, their Applications too.
    db.delete(profile)
    db.flush()
    _purge_user(db, user_id)
    db.commit()
    return {"status": "deleted"}


# ---------- Companies ----------

@router.get("/companies", response_model=List[AdminCompanyOut])
def list_all_companies(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(CompanyProfile).order_by(CompanyProfile.created_at.desc()).all()
    return [
        AdminCompanyOut(
            id=r.id,
            user_id=r.user_id,
            email=r.user.email,
            company_name=r.company_name,
            website=r.website,
            industry=r.industry,
            description=r.description,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.delete("/companies/{company_id}")
def delete_company(company_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    profile = db.query(CompanyProfile).filter(CompanyProfile.id == company_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Company profile not found")

    user_id = profile.user_id
    # cascade="all, delete-orphan" on CompanyProfile.jobs takes care of Job
    # rows and, via Job.applications, their JobApplications too.
    db.delete(profile)
    db.flush()
    _purge_user(db, user_id)
    db.commit()
    return {"status": "deleted"}


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


def _normalize_url(url: str) -> str:
    """A link saved without http(s):// (e.g. 'wa.me/xyz') is a *relative* URL
    to a browser, so it opens on our own domain instead of the real site.
    Add https:// automatically unless a scheme is already there."""
    if not url:
        return url
    url = url.strip()
    if url and not url.lower().startswith(("http://", "https://")):
        url = f"https://{url}"
    return url


@router.post("/media", response_model=AdminMediaOut)
def upload_media(
    title: str = Form(...),
    media_type: str = Form(...),
    file: UploadFile = File(...),
    description: str = Form(None),
    link_url: str = Form(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if media_type not in ("image", "video"):
        raise HTTPException(status_code=400, detail="media_type must be 'image' or 'video'")

    try:
        file_url = upload_to_cloudinary(file.file, folder="alumni_launch/admin_media", resource_type=media_type)
    except Exception as e:
        # Surface the real Cloudinary error (bad credentials, file too large for
        # the plan, unsupported format, etc.) instead of a generic 500.
        raise HTTPException(status_code=400, detail=f"Upload failed: {e}")

    item = AdminMedia(
        title=title,
        media_type=media_type,
        file_url=file_url,
        description=description,
        link_url=_normalize_url(link_url),
        uploaded_by_id=admin.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/media/public", response_model=List[AdminMediaOut])
def list_media_public(db: Session = Depends(get_db)):
    """No auth — this is what the public homepage gallery reads from."""
    items = db.query(AdminMedia).order_by(AdminMedia.created_at.desc()).all()
    for i in items:
        i.link_url = _normalize_url(i.link_url)
    return items


@router.get("/media", response_model=List[AdminMediaOut])
def list_media(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(AdminMedia).order_by(AdminMedia.created_at.desc()).all()


@router.delete("/media/{media_id}")
def delete_media(media_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    item = db.query(AdminMedia).filter(AdminMedia.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    try:
        os.remove(item.file_url.lstrip("/"))
    except OSError:
        pass
    db.delete(item)
    db.commit()
    return {"message": "deleted"}


# ---------- Sponsors ----------

@router.post("/sponsors", response_model=SponsorOut)
def upload_sponsor(
    name: str = Form(...),
    poster: UploadFile = File(...),
    description: str = Form(None),
    link_url: str = Form(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    poster_url = upload_to_cloudinary(poster.file, folder="alumni_launch/sponsors", resource_type="image")

    item = Sponsor(
        name=name,
        poster_url=poster_url,
        description=description,
        link_url=_normalize_url(link_url),
        uploaded_by_id=admin.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/sponsors/public", response_model=List[SponsorOut])
def list_sponsors_public(db: Session = Depends(get_db)):
    """No auth — public sponsors section reads from here."""
    items = db.query(Sponsor).order_by(Sponsor.created_at.desc()).all()
    for i in items:
        i.link_url = _normalize_url(i.link_url)
    return items


@router.get("/sponsors", response_model=List[SponsorOut])
def list_sponsors(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(Sponsor).order_by(Sponsor.created_at.desc()).all()


@router.delete("/sponsors/{sponsor_id}")
def delete_sponsor(sponsor_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    item = db.query(Sponsor).filter(Sponsor.id == sponsor_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "deleted"}


# ---------- Homepage video ----------

@router.post("/homepage-video", response_model=HomepageVideoOut)
def upload_homepage_video(
    video: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    video_url = upload_to_cloudinary(video.file, folder="alumni_launch/homepage", resource_type="video")

    row = db.query(HomepageVideo).first()
    if row:
        row.video_url = video_url
        row.uploaded_by_id = admin.id
    else:
        row = HomepageVideo(video_url=video_url, uploaded_by_id=admin.id)
        db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/homepage-video/public", response_model=HomepageVideoOut)
def get_homepage_video_public(db: Session = Depends(get_db)):
    """No auth — blank/null until an admin uploads one."""
    row = db.query(HomepageVideo).first()
    if not row:
        return HomepageVideoOut(video_url=None)
    return row


@router.delete("/homepage-video")
def delete_homepage_video(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    row = db.query(HomepageVideo).first()
    if row:
        db.delete(row)
        db.commit()
    return {"message": "cleared"}
