import json
from itertools import count
from typing import List, Optional

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.core.deps import get_current_user_ws
from app.core.security import is_admin_email
from app.models.models import ChatMessage, User
from app.schemas.schemas import ChatMessageOut

router = APIRouter(prefix="/chat", tags=["chat"])


class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []
        self.guest_labels = {}
        self._guest_counter = count(1)

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def assign_guest_label(self, ws: WebSocket) -> str:
        label = f"Unknown {next(self._guest_counter)}"
        self.guest_labels[ws] = label
        return label

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)
        self.guest_labels.pop(ws, None)

    async def broadcast(self, data: dict):
        dead = []
        for conn in self.active:
            try:
                await conn.send_json(data)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.disconnect(d)


manager = ConnectionManager()


@router.get("/history", response_model=List[ChatMessageOut])
def chat_history(db: Session = Depends(get_db)):
    return (
        db.query(ChatMessage)
        .order_by(ChatMessage.created_at.desc())
        .limit(50)
        .all()[::-1]
    )


@router.websocket("/ws")
async def chat_ws(websocket: WebSocket, user: Optional[User] = Depends(get_current_user_ws)):
    # Guests (no/invalid token) are allowed in — they chat as "Unknown N".
    await manager.connect(websocket)
    guest_label = None if user else manager.assign_guest_label(websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                payload = json.loads(raw)
                content = payload.get("content", "").strip()
            except (json.JSONDecodeError, AttributeError):
                content = raw.strip()

            if not content:
                continue

            db = SessionLocal()
            try:
                if user:
                    sender_name = _display_name(user)
                    sender_role = "admin" if is_admin_email(user.email) else (
                        user.role.value if hasattr(user.role, "value") else user.role
                    )
                    user_id = user.id
                else:
                    sender_name = guest_label
                    sender_role = "guest"
                    user_id = None

                msg = ChatMessage(
                    user_id=user_id,
                    sender_name=sender_name,
                    sender_role=sender_role,
                    content=content,
                )
                db.add(msg)
                db.commit()
                db.refresh(msg)

                await manager.broadcast({
                    "id": msg.id,
                    "sender_name": msg.sender_name,
                    "sender_role": msg.sender_role,
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat(),
                })
            finally:
                db.close()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


def _display_name(user: User) -> str:
    if is_admin_email(user.email):
        return "Admin \u2013 AlumniLaunch"
    if user.role.value == "alumni" and user.alumni_profile:
        return user.alumni_profile.name or user.email
    if user.role.value == "student" and user.student_profile:
        return user.student_profile.name or user.email
    if user.role.value == "company" and user.company_profile:
        return user.company_profile.company_name or user.email
    return user.email
