import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_student, require_rater
from app.models.models import Idea, IdeaRating, StudentProfile, User
from app.schemas.schemas import IdeaOut, IdeaRatingCreate, IdeaRatingOut
from app.utils.notify import notify_admin, broadcast

router = APIRouter(prefix="/ideas", tags=["ideas"])

POSTER_DIR = "uploads/idea_posters"
DOCUMENT_DIR = "uploads/idea_documents"
VOICE_DIR = "uploads/idea_voice_notes"
for d in (POSTER_DIR, DOCUMENT_DIR, VOICE_DIR):
    os.makedirs(d, exist_ok=True)


def _save_upload(upload: UploadFile, directory: str) -> str:
    ext = os.path.splitext(upload.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(directory, filename)
    with open(filepath, "wb") as f:
        f.write(upload.file.read())
    return filepath


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
        idea.poster_url = _save_upload(poster, POSTER_DIR)
    if document is not None and document.filename:
        idea.document_url = _save_upload(document, DOCUMENT_DIR)
    if voice_note is not None and voice_note.filename:
        idea.voice_note_url = _save_upload(voice_note, VOICE_DIR)

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
