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
    approval_status: str
    created_at: datetime

    class Config:
        from_attributes = True
