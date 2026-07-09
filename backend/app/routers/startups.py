from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_alumni, get_current_user
from app.models.models import Startup, User
from app.schemas.schemas import StartupCreate, StartupOut
from app.utils.notify import notify_admin, broadcast

router = APIRouter(prefix="/startups", tags=["startups"])


@router.post("", response_model=StartupOut)
def create_startup(
    payload: StartupCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_alumni),
):
    startup = Startup(
        alumni_id=user.alumni_profile.id,
        title=payload.title,
        domain=payload.domain,
        stage=payload.stage,
        description=payload.description,
        roles_needed=payload.roles_needed,
        skills_required=payload.skills_required,
        team_size_needed=payload.team_size_needed,
        is_paid=payload.is_paid,
        compensation_details=payload.compensation_details,
    )
    db.add(startup)
    db.commit()
    db.refresh(startup)

    notify_admin(
        db,
        title="New startup posted",
        message=f"{user.alumni_profile.name or user.email} posted a new startup: {startup.title}",
        link="/startups",
    )
    broadcast(
        db,
        title="New startup opportunity",
        message=f"{startup.title} is now open to join.",
        link=f"/startups",
        exclude_user_id=user.id,
    )
    return startup


@router.get("", response_model=List[StartupOut])
def list_startups(
    domain: Optional[str] = None,
    is_active: bool = True,
    db: Session = Depends(get_db),
):
    """Public listing — students browse open startup opportunities here."""
    query = db.query(Startup).filter(Startup.is_active == is_active)
    if domain:
        query = query.filter(Startup.domain.ilike(f"%{domain}%"))
    return query.order_by(Startup.created_at.desc()).all()


@router.get("/mine", response_model=List[StartupOut])
def my_startups(db: Session = Depends(get_db), user: User = Depends(require_alumni)):
    return db.query(Startup).filter(Startup.alumni_id == user.alumni_profile.id).all()


@router.get("/{startup_id}", response_model=StartupOut)
def get_startup(startup_id: str, db: Session = Depends(get_db)):
    startup = db.query(Startup).filter(Startup.id == startup_id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    return startup


@router.patch("/{startup_id}/close", response_model=StartupOut)
def close_startup(
    startup_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_alumni),
):
    startup = db.query(Startup).filter(Startup.id == startup_id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    if startup.alumni_id != user.alumni_profile.id:
        raise HTTPException(status_code=403, detail="Not your startup posting")

    startup.is_active = False
    db.commit()
    db.refresh(startup)
    return startup
