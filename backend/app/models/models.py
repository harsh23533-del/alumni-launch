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


class Idea(Base):
    """A student's startup/project idea — pitched with text, an optional poster,
    an optional document, and an optional voice note recording."""
    __tablename__ = "ideas"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    student_id = Column(UUID(as_uuid=False), ForeignKey("student_profiles.id"), nullable=False)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    requirement = Column(Text, nullable=True)  # what the student needs (funding, mentor, team...)
    poster_url = Column(String, nullable=True)
    document_url = Column(String, nullable=True)
    voice_note_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("StudentProfile")
    ratings = relationship("IdeaRating", back_populates="idea", cascade="all, delete-orphan")


class IdeaRating(Base):
    """One rating per (idea, rater) — only alumni/company accounts can rate."""
    __tablename__ = "idea_ratings"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    idea_id = Column(UUID(as_uuid=False), ForeignKey("ideas.id"), nullable=False)
    rater_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)

    stars = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    idea = relationship("Idea", back_populates="ratings")
    rater = relationship("User")


class IdeaJoinRequestStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class IdeaJoinRequest(Base):
    """A student asking to join another student's idea team. Owner accepts/rejects;
    accepted requesters become group members."""
    __tablename__ = "idea_join_requests"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    idea_id = Column(UUID(as_uuid=False), ForeignKey("ideas.id"), nullable=False)
    requester_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    status = Column(Enum(IdeaJoinRequestStatus), default=IdeaJoinRequestStatus.pending)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    idea = relationship("Idea")
    requester = relationship("User")


class IdeaGroupMessage(Base):
    """Group chat scoped to one idea — visible only to the idea's owner and
    students whose join request has been accepted."""
    __tablename__ = "idea_group_messages"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    idea_id = Column(UUID(as_uuid=False), ForeignKey("ideas.id"), nullable=False)
    sender_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    idea = relationship("Idea")
    sender = relationship("User")


class DirectMessage(Base):
    """Private 1:1 messages — e.g. an alumni or student messaging an idea's
    author. Only visible to the two people in the conversation."""
    __tablename__ = "direct_messages"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    sender_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    receiver_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    idea_id = Column(UUID(as_uuid=False), ForeignKey("ideas.id"), nullable=True)  # context, if any

    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    idea = relationship("Idea")


class ChatMessage(Base):
    """Simple global public chat room — every logged-in user can post/read here."""
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    sender_name = Column(String, nullable=False)
    sender_role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class AdminMedia(Base):
    """Video/image/poster uploads shown to admin for the media/gallery space."""
    __tablename__ = "admin_media"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    title = Column(String, nullable=False)
    media_type = Column(String, nullable=False)  # image | video
    file_url = Column(String, nullable=False)
    uploaded_by_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    uploaded_by = relationship("User")


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
