from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


# ---------- Auth ----------

class AlumniSignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    batch: Optional[str] = None
    branch: Optional[str] = None
    company: Optional[str] = None
    designation: Optional[str] = None
    linkedin_url: Optional[str] = None
    phone: Optional[str] = None


class StudentSignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    branch: Optional[str] = None
    year: Optional[str] = None
    skills: Optional[str] = None


class CompanySignupRequest(BaseModel):
    email: EmailStr
    password: str
    company_name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class CheckEmailResponse(BaseModel):
    exists_in_import: bool
    is_claimed: bool
    message: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    is_admin: bool = False


class SignupPendingResponse(BaseModel):
    status: str = "pending"
    message: str


class CheckAccountEmailRequest(BaseModel):
    email: EmailStr


class CheckAccountEmailResponse(BaseModel):
    found: bool
    message: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str


class ResetPasswordResponse(BaseModel):
    status: str = "reset"
    message: str


class MeOut(BaseModel):
    id: str
    email: str
    role: str
    name: str
    is_admin: bool = False


# ---------- Profiles ----------

class AlumniProfileOut(BaseModel):
    id: str
    email: str
    name: Optional[str]
    batch: Optional[str]
    branch: Optional[str]
    company: Optional[str]
    designation: Optional[str]
    linkedin_url: Optional[str]
    is_claimed: bool

    class Config:
        from_attributes = True


class StudentProfileOut(BaseModel):
    id: str
    name: str
    branch: Optional[str]
    year: Optional[str]
    skills: Optional[str]
    resume_url: Optional[str]
    approval_status: str

    class Config:
        from_attributes = True


class CompanyProfileOut(BaseModel):
    id: str
    company_name: str
    website: Optional[str]
    industry: Optional[str]
    description: Optional[str]

    class Config:
        from_attributes = True


# ---------- Admin ----------

class PendingStudentOut(BaseModel):
    id: str
    user_id: str
    email: str
    name: str
    branch: Optional[str]
    year: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Jobs ----------

class JobCreate(BaseModel):
    title: str
    job_type: str = "internship"  # internship | full_time | part_time
    location: Optional[str] = None
    description: Optional[str] = None
    skills_required: Optional[str] = None
    stipend_or_salary: Optional[str] = None
    apply_link: Optional[str] = None


class JobOut(BaseModel):
    id: str
    title: str
    job_type: str
    location: Optional[str]
    description: Optional[str]
    skills_required: Optional[str]
    stipend_or_salary: Optional[str]
    apply_link: Optional[str]
    is_active: bool
    created_at: datetime
    posted_by_name: Optional[str] = None
    posted_by_type: Optional[str] = None  # "alumni" | "company"

    class Config:
        from_attributes = True


class JobApplicationCreate(BaseModel):
    job_id: str
    message: Optional[str] = None


class JobApplicationOut(BaseModel):
    id: str
    job_id: str
    student_id: str
    message: Optional[str]
    resume_url: Optional[str]
    status: str
    created_at: datetime
    student_name: Optional[str] = None
    student_user_id: Optional[str] = None

    class Config:
        from_attributes = True


class JobApplicationStatusUpdate(BaseModel):
    status: str  # "shortlisted" | "rejected" | "hired"


# ---------- Notifications ----------

class NotificationOut(BaseModel):
    id: str
    title: str
    message: Optional[str]
    link: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Chat ----------

class ChatMessageOut(BaseModel):
    id: str
    sender_name: str
    sender_role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Startups ----------

class StartupCreate(BaseModel):
    title: str
    domain: Optional[str] = None
    stage: Optional[str] = None
    description: Optional[str] = None
    roles_needed: Optional[str] = None
    skills_required: Optional[str] = None
    team_size_needed: Optional[int] = None
    is_paid: bool = False
    compensation_details: Optional[str] = None


class StartupOut(BaseModel):
    id: str
    title: str
    domain: Optional[str]
    stage: Optional[str]
    description: Optional[str]
    roles_needed: Optional[str]
    skills_required: Optional[str]
    team_size_needed: Optional[int]
    is_paid: bool
    compensation_details: Optional[str]
    is_active: bool
    created_at: datetime
    alumni_id: str

    class Config:
        from_attributes = True


# ---------- Applications ----------

class ApplicationCreate(BaseModel):
    startup_id: str
    message: Optional[str] = None


class ApplicationOut(BaseModel):
    id: str
    startup_id: str
    student_id: str
    message: Optional[str]
    resume_url: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationStatusUpdate(BaseModel):
    status: str  # "accepted" or "rejected"


# ---------- Ideas ----------

class IdeaJoinRequestCreate(BaseModel):
    message: Optional[str] = None


class IdeaJoinRequestOut(BaseModel):
    id: str
    idea_id: str
    requester_id: str
    requester_name: Optional[str] = None
    status: str
    message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class IdeaGroupMessageCreate(BaseModel):
    content: str


class IdeaGroupMessageOut(BaseModel):
    id: str
    idea_id: str
    sender_id: str
    sender_name: Optional[str] = None
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class IdeaOut(BaseModel):
    id: str
    student_id: str
    title: str
    description: Optional[str]
    requirement: Optional[str]
    poster_url: Optional[str]
    document_url: Optional[str]
    voice_note_url: Optional[str]
    is_active: bool
    created_at: datetime
    student_name: Optional[str] = None
    student_user_id: Optional[str] = None
    avg_rating: float = 0
    ratings_count: int = 0
    my_rating: Optional[int] = None  # the current viewer's own rating, if any
    member_count: int = 0  # accepted group members, only populated on the /ideas/groups/mine endpoint

    class Config:
        from_attributes = True


class IdeaRatingCreate(BaseModel):
    stars: int  # 1-5
    comment: Optional[str] = None


class IdeaRatingOut(BaseModel):
    id: str
    idea_id: str
    rater_id: str
    stars: int
    comment: Optional[str]
    created_at: datetime
    rater_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Direct messages ----------

class DirectMessageCreate(BaseModel):
    receiver_id: str
    idea_id: Optional[str] = None
    content: str


class DirectMessageOut(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    idea_id: Optional[str]
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    other_user_id: str
    other_user_name: str
    other_user_role: str
    idea_id: Optional[str] = None
    idea_title: Optional[str] = None
    last_message: str
    last_message_at: datetime
    unread_count: int = 0
    pending_join_request_id: Optional[str] = None  # set when the other person has an open request to join your idea
