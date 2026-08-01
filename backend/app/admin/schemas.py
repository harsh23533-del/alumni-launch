from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AdminDashboardOut(BaseModel):
    total_students: int
    pending_students: int
    total_alumni: int
    claimed_alumni: int
    total_companies: int
    total_startups: int
    total_jobs: int
    total_startup_applications: int
    total_job_applications: int


class AdminStudentOut(BaseModel):
    id: str
    user_id: str
    email: str
    name: str
    branch: Optional[str]
    year: Optional[str]
    skills: Optional[str]
    resume_url: Optional[str]
    approval_status: str
    created_at: datetime

    class Config:
        from_attributes = True


# Full-detail views for the admin panel only — these intentionally expose
# more than the public-facing *Out schemas (phone numbers, contact email for
# companies, etc.) since only the admin account can ever reach these routes.

class AdminAlumniOut(BaseModel):
    id: str
    user_id: Optional[str]
    email: str
    name: Optional[str]
    batch: Optional[str]
    branch: Optional[str]
    company: Optional[str]
    designation: Optional[str]
    linkedin_url: Optional[str]
    phone: Optional[str]
    is_claimed: bool
    imported: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminCompanyOut(BaseModel):
    id: str
    user_id: str
    email: str
    company_name: str
    website: Optional[str]
    industry: Optional[str]
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
