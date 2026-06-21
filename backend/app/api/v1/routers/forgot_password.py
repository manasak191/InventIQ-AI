import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.db.database import get_db
from app.db.models.user import User
from app.services.email_service import _send_email
from app.core.security import hash_password

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory token store (use Redis/DB in production)
reset_tokens = {}

class ForgotRequest(BaseModel):
    email: EmailStr

class ResetRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(data: ForgotRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    # Always return success to prevent email enumeration
    if user:
        token = secrets.token_urlsafe(32)
        reset_tokens[token] = user.email
        reset_link = f"http://localhost:5173/reset-password?token={token}"
        _send_email(
            user.email,
            "InventIQ — Reset Your Password",
            f"Click the link below to reset your password:\n\n{reset_link}\n\nThis link expires in 30 minutes.\n\n— InventIQ AI"
        )
    return {"message": "If that email exists, a reset link has been sent."}

@router.post("/reset-password")
def reset_password(data: ResetRequest, db: Session = Depends(get_db)):
    email = reset_tokens.get(data.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = hash_password(data.new_password)
    db.commit()
    del reset_tokens[data.token]
    return {"message": "Password reset successfully. You can now log in."}
