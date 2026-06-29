from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.v1.schemas.user_schema import ResendOTP

from app.api.v1.schemas.user_schema import UserLogin, TokenResponse
from app.core.security import verify_password, create_access_token

from app.db.database import get_db
from app.db.models.user import User

from app.api.v1.schemas.user_schema import ResetPassword
from app.core.security import hash_password

import secrets
from app.api.v1.schemas.user_schema import ForgotPassword
from app.services.email_service import send_reset_email

from app.api.v1.schemas.user_schema import ChangePassword
from app.core.deps import get_current_user

from app.api.v1.schemas.user_schema import (
    UserRegister,
    OTPVerify
)

from app.core.security import hash_password
from app.services.otp_service import generate_otp
from app.services.email_service import send_otp_email

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.get("/")
def test():
    return {"message": "Auth Router Working"}


# ==========================
# REGISTER USER
# ==========================
@router.post("/register")
def register_user(
    user: UserRegister,
    db: Session = Depends(get_db)
):

    # Check if email already exists
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    otp = generate_otp()

    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        phone=user.phone,
        password_hash=hash_password(user.password),
        role=user.role,
        company_name=user.company_name,
        terms_accepted=user.terms_accepted,
        otp_code=otp
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    send_otp_email(user.email, otp)

    return {
        "message": "User Registered Successfully"
    }


@router.post("/resend-otp")
def resend_otp(
    data: ResendOTP,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    otp = generate_otp()

    user.otp_code = otp
    db.commit()

    send_otp_email(user.email, otp)

    return {
        "message": "OTP resent successfully"
    }


# ==========================
# VERIFY OTP
# ==========================
@router.post("/verify-otp")
def verify_otp(
    data: OTPVerify,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if str(user.otp_code) != str(data.otp):
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP"
        )

    user.email_verified = True
    user.otp_code = None

    db.commit()

    return {
        "message": "Email verified successfully"
    }


# ==========================
# LOGIN USER (issues JWT)
# ==========================
@router.post("/login", response_model=TokenResponse)
def login_user(
    data: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not verify_password(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=400,
            detail="Please verify your email first"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="This account has been suspended"
        )

    # Optional: cross-check requested role matches account role
    if data.role and data.role != user.role:
        raise HTTPException(
            status_code=403,
            detail=f"This account is registered as '{user.role}', not '{data.role}'"
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "first_name": user.first_name,
            "last_name": user.last_name,
        },
    }

@router.post("/forgot-password")
def forgot_password(
    data: ForgotPassword,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    token = secrets.token_urlsafe(32)

    user.reset_token = token

    db.commit()

    send_reset_email(user.email, token)

    return {
        "message": "Password reset email sent"
    }


@router.post("/reset-password")
def reset_password(
    data: ResetPassword,
    db: Session = Depends(get_db)
):
    # 1. Find user by token logic (IMPORTANT)
    user = db.query(User).filter(User.reset_token == data.token).first()

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )

    # 2. Update password
    user.password_hash = hash_password(data.new_password)

    # 3. Clear token
    user.reset_token = None

    db.commit()

    return {"message": "Password reset successful"}


@router.post("/change-password")
def change_password(
    data: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get logged-in user
    user = db.query(User).filter(User.id == current_user.id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Verify current password
    if not verify_password(data.old_password, user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    # Prevent using the same password
    if verify_password(data.new_password, user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="New password cannot be the same as the current password"
        )

    # Update password
    user.password_hash = hash_password(data.new_password)

    db.commit()

    return {
        "message": "Password changed successfully"
    }