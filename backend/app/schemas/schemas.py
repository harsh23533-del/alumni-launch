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
