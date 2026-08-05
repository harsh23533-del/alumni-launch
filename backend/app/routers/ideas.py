import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.cloudinary_config import upload_to_cloudinary
from app.core.database import get_db
from app.core.deps import get_current_user, require_student, require_rater
from app.models.models import Idea, IdeaRating, IdeaJoinRequest, IdeaJoinRequestStatus, IdeaGroupMessage, StudentProfile, User
from app.schemas.schemas import (
    IdeaOut, IdeaRatingCreate, IdeaRatingOut,
    IdeaJoinRequestCreate, IdeaJoinRequestOut,
    IdeaGroupMessageCreate, IdeaGroupMessageOut,
)
from app.utils.notify import notify_admin, notify_user, broadcast

router = APIRouter(prefix="/ideas", tags=["ideas"])


def _save_upload(upload: UploadFile, resource_type: str) -> str:
    return upload_to_cloudinary(upload.file, folder="alumni_launch/ideas", resource_type=resource_type)


def _serialize(idea: Idea, viewer: Optional[User] = None) -> IdeaOut:
    ratings = idea.ratings
    avg = round(sum(r.stars for r in ratings) / len(ratings), 1) if ratings else 0
    my_rating = None
    if viewer:
        mine = next((r for r in ratings if r.rater_id == viewer.id), None)
        my_rating = mine.stars if mine else None
    out = IdeaOut.model_validate(idea)
    out.student_name = idea.student.name if idea.student else None
    out.student_user_id = idea.student.user_id if idea.student else None
    out.avg_rating = avg
    out.ratings_count = len(ratings)
    out.my_rating = my_rating
    return out


@router.post("", response_model=IdeaOut)
async def create_idea(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    requirement: Optional[str] = Form(None),
    poster: Optional[UploadFile] = File(None),
    document: Optional[UploadFile] = File(None),
    voice_note: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_student),
):
    idea = Idea(
        student_id=user.student_profile.id,
        title=title,
        description=description,
        requirement=requirement,
    )
    if poster is not None and poster.filename:
        idea.poster_url = _save_upload(poster, "image")
    if document is not None and document.filename:
        idea.document_url = _save_upload(document, "raw")
    if voice_note is not None and voice_note.filename:
        idea.voice_note_url = _save_upload(voice_note, "video")  # audio uploads use Cloudinary's video pipeline

    db.add(idea)
    db.commit()
    db.refresh(idea)

    notify_admin(
        db,
        title="New idea posted",
        message=f"{user.student_profile.name} posted a new idea: {idea.title}",
        link="/ideas",
    )
    broadcast(
        db,
        title="New student idea",
        message=f"{idea.title} is looking for feedback and support.",
        link="/ideas",
        exclude_user_id=user.id,
    )
    return _serialize(idea, user)


@router.get("", response_model=List[IdeaOut])
def list_ideas(db: Session = Depends(get_db)):
    """Public listing — anyone can browse ideas; only alumni/companies can rate them."""
    ideas = db.query(Idea).filter(Idea.is_active == True).order_by(Idea.created_at.desc()).all()  # noqa: E712
    return [_serialize(i) for i in ideas]


@router.get("/mine", response_model=List[IdeaOut])
def my_ideas(db: Session = Depends(get_db), user: User = Depends(require_student)):
    ideas = db.query(Idea).filter(Idea.student_id == user.student_profile.id).order_by(Idea.created_at.desc()).all()
    return [_serialize(i, user) for i in ideas]


@router.get("/{idea_id}", response_model=IdeaOut)
def get_idea(idea_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    return _serialize(idea, user)


@router.post("/{idea_id}/rate", response_model=IdeaRatingOut)
def rate_idea(
    idea_id: str,
    payload: IdeaRatingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_rater),
):
    if not (1 <= payload.stars <= 5):
        raise HTTPException(status_code=400, detail="Stars must be between 1 and 5")

    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    existing = db.query(IdeaRating).filter(
        IdeaRating.idea_id == idea_id, IdeaRating.rater_id == user.id
    ).first()
    if existing:
        existing.stars = payload.stars
        existing.comment = payload.comment
        db.commit()
        db.refresh(existing)
        rating = existing
    else:
        rating = IdeaRating(idea_id=idea_id, rater_id=user.id, stars=payload.stars, comment=payload.comment)
        db.add(rating)
        db.commit()
        db.refresh(rating)

    rater_name = user.alumni_profile.name if user.role == "alumni" and user.alumni_profile else \
        (user.company_profile.company_name if user.role == "company" and user.company_profile else user.email)

    out = IdeaRatingOut.model_validate(rating)
    out.rater_name = rater_name
    return out


def _display_name(user: User) -> str:
    if user.role == "alumni" and user.alumni_profile:
        return user.alumni_profile.name or user.email
    if user.role == "student" and user.student_profile:
        return user.student_profile.name or user.email
    if user.role == "company" and user.company_profile:
        return user.company_profile.company_name or user.email
    return user.email


def _is_owner(idea: Idea, user: User) -> bool:
    return user.role == "student" and user.student_profile and idea.student_id == user.student_profile.id


def _is_accepted_member(db: Session, idea_id: str, user_id: str) -> bool:
    return db.query(IdeaJoinRequest).filter(
        IdeaJoinRequest.idea_id == idea_id,
        IdeaJoinRequest.requester_id == user_id,
        IdeaJoinRequest.status == IdeaJoinRequestStatus.accepted,
    ).first() is not None


@router.post("/{idea_id}/join-requests", response_model=IdeaJoinRequestOut)
def request_to_join(
    idea_id: str,
    payload: IdeaJoinRequestCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_student),
):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    if _is_owner(idea, user):
        raise HTTPException(status_code=400, detail="You can't request to join your own idea")

    existing = db.query(IdeaJoinRequest).filter(
        IdeaJoinRequest.idea_id == idea_id, IdeaJoinRequest.requester_id == user.id
    ).first()
    if existing:
        if existing.status == IdeaJoinRequestStatus.pending:
            raise HTTPException(status_code=400, detail="Request already pending")
        if existing.status == IdeaJoinRequestStatus.accepted:
            raise HTTPException(status_code=400, detail="You're already in this group")
        existing.status = IdeaJoinRequestStatus.pending
        existing.message = payload.message
        db.commit()
        db.refresh(existing)
        req = existing
    else:
        req = IdeaJoinRequest(idea_id=idea_id, requester_id=user.id, message=payload.message)
        db.add(req)
        db.commit()
        db.refresh(req)

    notify_user(
        db,
        user_id=idea.student.user_id,
        title="New join request",
        message=f"{_display_name(user)} wants to join your idea: {idea.title}",
        link="/ideas",
    )

    out = IdeaJoinRequestOut.model_validate(req)
    out.requester_name = _display_name(user)
    return out


@router.get("/{idea_id}/join-requests", response_model=List[IdeaJoinRequestOut])
def list_join_requests(idea_id: str, db: Session = Depends(get_db), user: User = Depends(require_student)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    if not _is_owner(idea, user):
        raise HTTPException(status_code=403, detail="Only the idea owner can view join requests")

    requests = db.query(IdeaJoinRequest).filter(IdeaJoinRequest.idea_id == idea_id).order_by(
        IdeaJoinRequest.created_at.desc()
    ).all()
    out = []
    for r in requests:
        item = IdeaJoinRequestOut.model_validate(r)
        item.requester_name = _display_name(r.requester)
        out.append(item)
    return out


@router.post("/join-requests/{request_id}/accept", response_model=IdeaJoinRequestOut)
def accept_join_request(request_id: str, db: Session = Depends(get_db), user: User = Depends(require_student)):
    req = db.query(IdeaJoinRequest).filter(IdeaJoinRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if not _is_owner(req.idea, user):
        raise HTTPException(status_code=403, detail="Only the idea owner can accept requests")

    req.status = IdeaJoinRequestStatus.accepted
    db.commit()
    db.refresh(req)

    notify_user(
        db,
        user_id=req.requester_id,
        title="Join request accepted",
        message=f"You're now part of the group for: {req.idea.title}",
        link="/ideas",
    )

    out = IdeaJoinRequestOut.model_validate(req)
    out.requester_name = _display_name(req.requester)
    return out


@router.post("/join-requests/{request_id}/reject", response_model=IdeaJoinRequestOut)
def reject_join_request(request_id: str, db: Session = Depends(get_db), user: User = Depends(require_student)):
    req = db.query(IdeaJoinRequest).filter(IdeaJoinRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if not _is_owner(req.idea, user):
        raise HTTPException(status_code=403, detail="Only the idea owner can reject requests")

    req.status = IdeaJoinRequestStatus.rejected
    db.commit()
    db.refresh(req)

    out = IdeaJoinRequestOut.model_validate(req)
    out.requester_name = _display_name(req.requester)
    return out


@router.get("/{idea_id}/group/members", response_model=List[IdeaJoinRequestOut])
def list_group_members(idea_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    if not (_is_owner(idea, user) or _is_accepted_member(db, idea_id, user.id)):
        raise HTTPException(status_code=403, detail="Only group members can view this")

    members = db.query(IdeaJoinRequest).filter(
        IdeaJoinRequest.idea_id == idea_id, IdeaJoinRequest.status == IdeaJoinRequestStatus.accepted
    ).all()
    out = []
    for m in members:
        item = IdeaJoinRequestOut.model_validate(m)
        item.requester_name = _display_name(m.requester)
        out.append(item)
    return out


@router.get("/{idea_id}/group/messages", response_model=List[IdeaGroupMessageOut])
def list_group_messages(idea_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    if not (_is_owner(idea, user) or _is_accepted_member(db, idea_id, user.id)):
        raise HTTPException(status_code=403, detail="Only group members can view this")

    messages = db.query(IdeaGroupMessage).filter(IdeaGroupMessage.idea_id == idea_id).order_by(
        IdeaGroupMessage.created_at.asc()
    ).all()
    out = []
    for m in messages:
        item = IdeaGroupMessageOut.model_validate(m)
        item.sender_name = _display_name(m.sender)
        out.append(item)
    return out


@router.post("/{idea_id}/group/messages", response_model=IdeaGroupMessageOut)
def send_group_message(
    idea_id: str,
    payload: IdeaGroupMessageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    if not (_is_owner(idea, user) or _is_accepted_member(db, idea_id, user.id)):
        raise HTTPException(status_code=403, detail="Only group members can post here")

    msg = IdeaGroupMessage(idea_id=idea_id, sender_id=user.id, content=payload.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)

    out = IdeaGroupMessageOut.model_validate(msg)
    out.sender_name = _display_name(user)
    return out
