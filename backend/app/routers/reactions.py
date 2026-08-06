from collections import defaultdict
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_user_optional
from app.models.models import Reaction, User
from app.schemas.schemas import ReactionSummaryItem, ReactionToggleIn

router = APIRouter(prefix="/reactions", tags=["reactions"])

VALID_TARGET_TYPES = ("media", "sponsor", "idea")


def _summary(db: Session, target_type: str, target_id: str, me: Optional[User]) -> List[ReactionSummaryItem]:
    rows = db.query(Reaction).filter(
        Reaction.target_type == target_type, Reaction.target_id == target_id
    ).all()
    counts = defaultdict(int)
    mine = set()
    for r in rows:
        counts[r.emoji] += 1
        if me and r.user_id == me.id:
            mine.add(r.emoji)
    return [
        ReactionSummaryItem(emoji=emoji, count=count, reacted_by_me=emoji in mine)
        for emoji, count in sorted(counts.items(), key=lambda x: -x[1])
    ]


@router.get("", response_model=List[ReactionSummaryItem])
def get_reactions(
    target_type: str,
    target_id: str,
    db: Session = Depends(get_db),
    me: Optional[User] = Depends(get_current_user_optional),
):
    if target_type not in VALID_TARGET_TYPES:
        raise HTTPException(status_code=400, detail="Invalid target_type")
    return _summary(db, target_type, target_id, me)


@router.post("/toggle", response_model=List[ReactionSummaryItem])
def toggle_reaction(
    payload: ReactionToggleIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.target_type not in VALID_TARGET_TYPES:
        raise HTTPException(status_code=400, detail="Invalid target_type")
    emoji = payload.emoji.strip()
    if not emoji:
        raise HTTPException(status_code=400, detail="Pick an emoji first")
    if len(emoji) > 16:  # generous — covers multi-codepoint emoji (skin tone, ZWJ sequences)
        raise HTTPException(status_code=400, detail="That doesn't look like a single emoji")

    existing = db.query(Reaction).filter(
        Reaction.target_type == payload.target_type,
        Reaction.target_id == payload.target_id,
        Reaction.user_id == user.id,
        Reaction.emoji == emoji,
    ).first()

    if existing:
        db.delete(existing)
    else:
        db.add(Reaction(
            target_type=payload.target_type,
            target_id=payload.target_id,
            user_id=user.id,
            emoji=emoji,
        ))
    db.commit()

    return _summary(db, payload.target_type, payload.target_id, user)
