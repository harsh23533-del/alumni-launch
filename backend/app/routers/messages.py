from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import DirectMessage, Idea, IdeaJoinRequest, IdeaJoinRequestStatus, User
from app.schemas.schemas import DirectMessageCreate, DirectMessageOut, ConversationOut
from app.utils.notify import notify_user

router = APIRouter(prefix="/messages", tags=["messages"])


def _display_name(user: User) -> str:
    if user.role == "alumni" and user.alumni_profile:
        return user.alumni_profile.name or user.email
    if user.role == "student" and user.student_profile:
        return user.student_profile.name or user.email
    if user.role == "company" and user.company_profile:
        return user.company_profile.company_name or user.email
    return user.email


@router.post("", response_model=DirectMessageOut)
def send_message(
    payload: DirectMessageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.receiver_id == user.id:
        raise HTTPException(status_code=400, detail="Can't message yourself")

    receiver = db.query(User).filter(User.id == payload.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Recipient not found")

    if payload.idea_id:
        idea = db.query(Idea).filter(Idea.id == payload.idea_id).first()
        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found")

    msg = DirectMessage(
        sender_id=user.id,
        receiver_id=payload.receiver_id,
        idea_id=payload.idea_id,
        content=payload.content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    notify_user(
        db,
        user_id=receiver.id,
        title=f"New message from {_display_name(user)}",
        message=payload.content[:120],
        link="/messages",
    )
    return msg


@router.get("/conversations", response_model=List[ConversationOut])
def list_conversations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """One row per person the current user has exchanged messages with —
    private to this user, nobody else can see who they're talking to."""
    msgs = (
        db.query(DirectMessage)
        .filter(or_(DirectMessage.sender_id == user.id, DirectMessage.receiver_id == user.id))
        .order_by(DirectMessage.created_at.desc())
        .all()
    )

    seen = {}
    for m in msgs:
        other_id = m.receiver_id if m.sender_id == user.id else m.sender_id
        if other_id in seen:
            continue
        other = db.query(User).filter(User.id == other_id).first()
        if not other:
            continue
        unread = (
            db.query(DirectMessage)
            .filter(
                DirectMessage.sender_id == other_id,
                DirectMessage.receiver_id == user.id,
                DirectMessage.is_read == False,  # noqa: E712
            )
            .count()
        )
        pending_request_id = None
        if m.idea_id and m.idea and m.idea.student and m.idea.student.user_id == user.id:
            pending = (
                db.query(IdeaJoinRequest)
                .filter(
                    IdeaJoinRequest.idea_id == m.idea_id,
                    IdeaJoinRequest.requester_id == other_id,
                    IdeaJoinRequest.status == IdeaJoinRequestStatus.pending,
                )
                .first()
            )
            if pending:
                pending_request_id = pending.id
        seen[other_id] = ConversationOut(
            other_user_id=other.id,
            other_user_name=_display_name(other),
            other_user_role=other.role,
            idea_id=m.idea_id,
            idea_title=m.idea.title if m.idea else None,
            last_message=m.content,
            last_message_at=m.created_at,
            unread_count=unread,
            pending_join_request_id=pending_request_id,
        )
    return list(seen.values())


@router.get("/thread/{other_user_id}", response_model=List[DirectMessageOut])
def get_thread(other_user_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Full private thread between the current user and one other person.
    Only the two participants can ever see these — no one else, not even admins."""
    msgs = (
        db.query(DirectMessage)
        .filter(
            or_(
                and_(DirectMessage.sender_id == user.id, DirectMessage.receiver_id == other_user_id),
                and_(DirectMessage.sender_id == other_user_id, DirectMessage.receiver_id == user.id),
            )
        )
        .order_by(DirectMessage.created_at.asc())
        .all()
    )

    unread_ids = [m.id for m in msgs if m.receiver_id == user.id and not m.is_read]
    if unread_ids:
        db.query(DirectMessage).filter(DirectMessage.id.in_(unread_ids)).update(
            {DirectMessage.is_read: True}, synchronize_session=False
        )
        db.commit()

    return msgs
