from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import ADMIN_EMAIL
from app.models.models import Notification, User


def notify_user(db: Session, user_id: str, title: str, message: Optional[str] = None, link: Optional[str] = None):
    n = Notification(user_id=user_id, title=title, message=message, link=link)
    db.add(n)
    db.commit()
    return n


def notify_admin(db: Session, title: str, message: Optional[str] = None, link: Optional[str] = None):
    admin_user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
    if not admin_user:
        return None
    return notify_user(db, admin_user.id, title, message, link)


def broadcast(db: Session, title: str, message: Optional[str] = None, link: Optional[str] = None, exclude_user_id: Optional[str] = None):
    """Send the same notification to every user — e.g. 'new startup posted'."""
    users = db.query(User).all()
    for u in users:
        if exclude_user_id and u.id == exclude_user_id:
            continue
        db.add(Notification(user_id=u.id, title=title, message=message, link=link))
    db.commit()
