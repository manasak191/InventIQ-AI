from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None = None
    password: str
    role: str
    company_name: str | None = None
    terms_accepted: bool


class OTPVerify(BaseModel):
    email: EmailStr
    otp: str


class ResendOTP(BaseModel):
    email: EmailStr


class UserLogin(BaseModel):
    email: str
    password: str
    role: Optional[str] = None  # optional cross-check against account role


class UserOut(BaseModel):
    id: int
    email: str
    role: str
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class ResetPassword(BaseModel):
    token: str
    new_password: str

class ForgotPassword(BaseModel):
    email: EmailStr