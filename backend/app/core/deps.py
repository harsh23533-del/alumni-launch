from typing import Optional

from fastapi import Depends, HTTPException, Query, WebSocket, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token, is_admin_email
from app.models.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def require_alumni(user: User = Depends(get_current_user)) -> User:
    if user.role != "alumni":
        raise HTTPException(status_code=403, detail="Only alumni can perform this action")
    return user


def require_student(user: User = Depends(get_current_user)) -> User:
    if user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can perform this action")
    return user


def require_company(user: User = Depends(get_current_user)) -> User:
    if user.role != "company":
        raise HTTPException(status_code=403, detail="Only companies can perform this action")
    return user


def require_poster(user: User = Depends(get_current_user)) -> User:
    """Jobs can be posted by either alumni or company accounts."""
    if user.role not in ("alumni", "company"):
        raise HTTPException(status_code=403, detail="Only alumni or companies can post jobs")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not is_admin_email(user.email):
        raise HTTPException(status_code=403, detail="Admin access only")
    return user


def get_current_user_ws(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Auth for the chat WebSocket ΓÇö token comes as a query param since browsers
    can't set custom headers on a WebSocket handshake."""
    if not token:
        return None
    payload = decode_access_token(token)
    if payload is None:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id).first()
