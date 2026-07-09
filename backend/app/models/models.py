import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    alumni = "alumni"
    student = "student"
    company = "company"


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class StudentApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class JobType(str, enum.Enum):
    internship = "internship"
    full_time = "full_time"
    part_time = "part_time"


class JobApplicationStatus(str, enum.Enum):
    pending = "pending"
    shortlisted = "shortlisted"
    rejected = "rejected"
    hired = "hired"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    alumni_profile = relationship("AlumniProfile", back_populates="user", uselist=False)
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    company_profile = relationship("CompanyProfile", back_populates="user", uselist=False)


class AlumniProfile(Base):
    """
    Rows here can exist WITHOUT a linked user (imported from SQL file, is_claimed=False).
    When someone signs up with a matching email, we link user_id and set is_claimed=True.
    """
    __tablename__ = "alumni_profiles"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True, unique=True)

    email = Column(String, index=True, nullable=False)  # used for matching on signup
    name = Column(String, nullable=True)
    batch = Column(String, nullable=True)
    branch = Column(String, nullable=True)
    company = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    is_claimed = Column(Boolean, default=False)  # False = imported but never signed up
    imported = Column(Boolean, default=False)    # True = came from SQL/CSV import
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="alumni_profile")
    startups = relationship("Startup", back_populates="alumni", cascade="all, delete-orphan")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, unique=True)

    name = Column(String, nullable=False)
    branch = Column(String, nullable=True)
    year = Column(String, nullable=True)
    skills = Column(Text, nullable=True)  # comma separated
    resume_url = Column(String, nullable=True)
    approval_status = Column(Enum(StudentApprovalStatus), default=StudentApprovalStatus.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="student_profile")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")
    job_applications = relationship("JobApplication", back_populates="student", cascade="all, delete-orphan")


class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False, unique=True)

    company_name = Column(String, nullable=False)
    website = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="company_profile")
    jobs = relationship("Job", back_populates="company", cascade="all, delete-orphan")


class Startup(Base):
    __tablename__ = "startups"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    alumni_id = Column(UUID(as_uuid=False), ForeignKey("alumni_profiles.id"), nullable=False)

    title = Column(String, nullable=False)
    domain = Column(String, nullable=True)          # e.g. Fintech, EdTech, AI/ML
    stage = Column(String, nullable=True)            # idea / MVP / early revenue / funded
    description = Column(Text, nullable=True)
    roles_needed = Column(Text, nullable=True)       # comma separated e.g. "Backend Dev, Designer"
    skills_required = Column(Text, nullable=True)
    team_size_needed = Column(Integer, nullable=True)
    is_paid = Column(Boolean, default=False)
    compensation_details = Column(String, nullable=True)  # e.g. "Equity only", "₹10k/month + equity"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    alumni = relationship("AlumniProfile", back_populates="startups")
    applications = relationship("Application", back_populates="startup", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    startup_id = Column(UUID(as_uuid=False), ForeignKey("startups.id"), nullable=False)
    student_id = Column(UUID(as_uuid=False), ForeignKey("student_profiles.id"), nullable=False)

    message = Column(Text, nullable=True)      # student's pitch / "I will join if accepted"
    resume_url = Column(String, nullable=True)  # can override profile resume for this application
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)

    startup = relationship("Startup", back_populates="applications")
    student = relationship("StudentProfile", back_populates="applications")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    # Either an alumni or a company can post a job — exactly one of these two is set.
    alumni_id = Column(UUID(as_uuid=False), ForeignKey("alumni_profiles.id"), nullable=True)
    company_id = Column(UUID(as_uuid=False), ForeignKey("company_profiles.id"), nullable=True)

    title = Column(String, nullable=False)
    job_type = Column(Enum(JobType), default=JobType.internship)
    location = Column(String, nullable=True)   # e.g. "Remote", "Bengaluru"
    description = Column(Text, nullable=True)
    skills_required = Column(Text, nullable=True)  # comma separated
    stipend_or_salary = Column(String, nullable=True)
    apply_link = Column(String, nullable=True)  # optional external link
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    alumni = relationship("AlumniProfile")
    company = relationship("CompanyProfile", back_populates="jobs")
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    job_id = Column(UUID(as_uuid=False), ForeignKey("jobs.id"), nullable=False)
    student_id = Column(UUID(as_uuid=False), ForeignKey("student_profiles.id"), nullable=False)

    message = Column(Text, nullable=True)
    resume_url = Column(String, nullable=True)
    status = Column(Enum(JobApplicationStatus), default=JobApplicationStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="applications")
    student = relationship("StudentProfile", back_populates="job_applications")


class ChatMessage(Base):
    """Simple global public chat room — every logged-in user can post/read here."""
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    sender_name = Column(String, nullable=False)
    sender_role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    link = Column(String, nullable=True)  # frontend route to navigate to on click
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
