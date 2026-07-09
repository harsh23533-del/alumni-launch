from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.models import StudentProfile, User, StudentApprovalStatus
from app.schemas.schemas import PendingStudentOut
from app.utils.notify import notify_user

router = APIRouter(prefix="/admin", tags=["admin"])


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
