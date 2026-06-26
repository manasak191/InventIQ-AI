# Save as: backend/app/api/v1/routers/messages.py

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db.models.message import Message
from app.db.models.user import User
from app.core.deps import get_current_user, require_admin
from app.api.v1.schemas.message_schema import MessageCreate, MessageReply, MessageStatusUpdate

router = APIRouter(prefix="/messages", tags=["Messages"])


def serialize(m: Message, db: Session) -> dict:
    sender = db.query(User).filter(User.id == m.user_id).first()
    replier = db.query(User).filter(User.id == m.replied_by).first() if m.replied_by else None
    return {
        "id": m.id,
        "user_id": m.user_id,
        "sender_name": f"{sender.first_name} {sender.last_name}".strip() if sender else None,
        "sender_email": sender.email if sender else None,
        "category": m.category,
        "reference": m.reference,
        "subject": m.subject,
        "body": m.body,
        "status": m.status,
        "admin_reply": m.admin_reply,
        "replied_by_name": f"{replier.first_name} {replier.last_name}".strip() if replier else None,
        "replied_at": m.replied_at,
        "created_at": m.created_at,
        "updated_at": m.updated_at,
    }


@router.post("")
def create_message(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msg = Message(
        user_id=current_user.id,
        category=payload.category,
        reference=payload.reference,
        subject=payload.subject,
        body=payload.body,
        status="open",
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return serialize(msg, db)


@router.get("/my")
def list_my_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msgs = (
        db.query(Message)
        .filter(Message.user_id == current_user.id)
        .order_by(Message.id.desc())
        .all()
    )
    return [serialize(m, db) for m in msgs]


@router.get("")
def list_all_messages(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    q = db.query(Message)
    if status:
        q = q.filter(Message.status == status)
    if category:
        q = q.filter(Message.category == category)
    if search:
        q = q.join(User, Message.user_id == User.id).filter(
            Message.subject.ilike(f"%{search}%")
            | Message.body.ilike(f"%{search}%")
            | User.first_name.ilike(f"%{search}%")
            | User.last_name.ilike(f"%{search}%")
            | User.email.ilike(f"%{search}%")
        )
    msgs = q.order_by(Message.id.desc()).all()
    return [serialize(m, db) for m in msgs]


@router.patch("/{message_id}/reply")
def reply_to_message(
    message_id: int,
    payload: MessageReply,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    msg.admin_reply = payload.reply
    msg.replied_by = current_user.id
    msg.replied_at = datetime.now(timezone.utc)
    msg.status = "answered"
    db.commit()
    db.refresh(msg)
    return serialize(msg, db)


@router.patch("/{message_id}/status")
def update_message_status(
    message_id: int,
    payload: MessageStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    msg.status = payload.status
    db.commit()
    db.refresh(msg)
    return serialize(msg, db)


@router.delete("/{message_id}")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    is_owner = msg.user_id == current_user.id
    is_admin = current_user.role == "admin"

    if not is_admin and not (is_owner and msg.status == "open"):
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own messages while they're still open",
        )

    db.delete(msg)
    db.commit()
    return {"message": "Message deleted", "id": message_id}