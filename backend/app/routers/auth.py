from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.models import User, AlumniProfile, StudentProfile, UserRole
from app.schemas.schemas import (
    AlumniSignupRequest, StudentSignupRequest, LoginRequest,
    CheckEmailResponse, TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/check-alumni-email", response_model=CheckEmailResponse)
def check_alumni_email(email: str, db: Session = Depends(get_db)):
    """
    Call this BEFORE showing the alumni signup form.
    If a matching imported record exists and isn't claimed yet,
    frontend should show 'We found your profile — claim it' instead of a blank form.
    """
    existing = db.query(AlumniProfile).filter(AlumniProfile.email == email).first()

    if existing is None:
        return CheckEmailResponse(
            exists_in_import=False,
            is_claimed=False,
            message="No existing record found. Please sign up fresh.",
        )

    if existing.is_claimed:
        return CheckEmailResponse(
            exists_in_import=True,
            is_claimed=True,
            message="This email is already registered. Please log in instead.",
        )

    return CheckEmailResponse(
        exists_in_import=True,
        is_claimed=False,
        message=f"We found your profile ({existing.name or 'imported record'}). Set a password to claim it.",
    )


@router.post("/signup/alumni", response_model=TokenResponse)
def signup_alumni(payload: AlumniSignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in.")

    existing_profile = db.query(AlumniProfile).filter(AlumniProfile.email == payload.email).first()

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.alumni,
    )
    db.add(user)
    db.flush()  # get user.id before commit

    if existing_profile and not existing_profile.is_claimed:
        # CLAIM the pre-existing imported profile instead of creating a duplicate
        existing_profile.user_id = user.id
        existing_profile.is_claimed = True
        # fill in any missing fields the import might not have had
        existing_profile.name = existing_profile.name or payload.name
        existing_profile.batch = existing_profile.batch or payload.batch
        existing_profile.branch = existing_profile.branch or payload.branch
        existing_profile.company = existing_profile.company or payload.company
        existing_profile.designation = existing_profile.designation or payload.designation
        existing_profile.linkedin_url = existing_profile.linkedin_url or payload.linkedin_url
        existing_profile.phone = existing_profile.phone or payload.phone
    else:
        # brand new alumni, no prior import record
        profile = AlumniProfile(
            user_id=user.id,
            email=payload.email,
            name=payload.name,
            batch=payload.batch,
            branch=payload.branch,
            company=payload.company,
            designation=payload.designation,
            linkedin_url=payload.linkedin_url,
            phone=payload.phone,
            is_claimed=True,
            imported=False,
        )
        db.add(profile)

    db.commit()

    token = create_access_token({"sub": user.id, "role": "alumni"})
    return TokenResponse(access_token=token, role="alumni")


@router.post("/signup/student", response_model=TokenResponse)
def signup_student(payload: StudentSignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in.")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.student,
    )
    db.add(user)
    db.flush()

    profile = StudentProfile(
        user_id=user.id,
        name=payload.name,
        branch=payload.branch,
        year=payload.year,
        skills=payload.skills,
    )
    db.add(profile)
    db.commit()

    token = create_access_token({"sub": user.id, "role": "student"})
    return TokenResponse(access_token=token, role="student")


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenResponse(access_token=token, role=user.role.value)
