from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, is_knit_email, is_admin_email
from app.models.models import (
    User, AlumniProfile, StudentProfile, CompanyProfile, UserRole, StudentApprovalStatus,
)
from app.schemas.schemas import (
    AlumniSignupRequest, StudentSignupRequest, CompanySignupRequest, LoginRequest,
    CheckEmailResponse, TokenResponse, SignupPendingResponse,
)
from app.utils.notify import notify_admin

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
    return TokenResponse(access_token=token, role="alumni", is_admin=is_admin_email(user.email))


@router.post("/signup/student", response_model=SignupPendingResponse)
def signup_student(payload: StudentSignupRequest, db: Session = Depends(get_db)):
    if not is_knit_email(payload.email):
        raise HTTPException(status_code=400, detail="Student signup requires a @knit.ac.in email address.")

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
        approval_status=StudentApprovalStatus.pending,
    )
    db.add(profile)
    db.commit()

    notify_admin(
        db,
        title="New student signup awaiting approval",
        message=f"{payload.name} ({payload.email}) signed up as a student.",
        link="/admin/approvals",
    )

    return SignupPendingResponse(
        status="pending",
        message="Your account has been created and is awaiting admin approval. You'll be notified once approved.",
    )


@router.post("/signup/company", response_model=TokenResponse)
def signup_company(payload: CompanySignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in.")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.company,
    )
    db.add(user)
    db.flush()

    profile = CompanyProfile(
        user_id=user.id,
        company_name=payload.company_name,
        website=payload.website,
        industry=payload.industry,
        description=payload.description,
    )
    db.add(profile)
    db.commit()

    token = create_access_token({"sub": user.id, "role": "company"})
    return TokenResponse(access_token=token, role="company", is_admin=is_admin_email(user.email))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.role == UserRole.student and user.student_profile:
        status = user.student_profile.approval_status
        if status == StudentApprovalStatus.pending:
            raise HTTPException(status_code=403, detail="Your account is still awaiting admin approval.")
        if status == StudentApprovalStatus.rejected:
            raise HTTPException(status_code=403, detail="Your signup request was rejected. Contact the admin for details.")

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenResponse(access_token=token, role=user.role.value, is_admin=is_admin_email(user.email))
