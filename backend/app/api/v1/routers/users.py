from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.user import User
from app.core.deps import require_admin

router = APIRouter(prefix="/admin/users", tags=["Admin - Users"])


def serialize(u: User) -> dict:
    return {
        "id": u.id,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "email": u.email,
        "phone": u.phone,
        "role": u.role,
        "company_name": u.company_name,
        "email_verified": u.email_verified,
        "is_active": u.is_active,
        "created_at": u.created_at,
    }


@router.get("")
def list_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    users = db.query(User).order_by(User.id.desc()).all()
    return [serialize(u) for u in users]


@router.put("/{user_id}")
def update_user(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    allowed_fields = {"first_name", "last_name", "role", "company_name", "phone"}
    for field, value in payload.items():
        if field in allowed_fields:
            setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return serialize(user)


@router.patch("/{user_id}/suspend")
def suspend_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    return serialize(user)


@router.patch("/{user_id}/restore")
def restore_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    return serialize(user)
