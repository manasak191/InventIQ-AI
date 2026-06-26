# Save as: backend/app/api/v1/schemas/message_schema.py

from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

VALID_CATEGORIES = ("product", "supplier", "transaction", "other")
VALID_STATUSES = ("open", "answered", "closed")


class MessageCreate(BaseModel):
    category: str = "other"
    reference: Optional[str] = None
    subject: str
    body: str

    @field_validator("category")
    @classmethod
    def validate_category(cls, v):
        if v not in VALID_CATEGORIES:
            raise ValueError(f"Category must be one of {VALID_CATEGORIES}")
        return v

    @field_validator("subject", "body")
    @classmethod
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("This field cannot be empty")
        return v.strip()


class MessageReply(BaseModel):
    reply: str

    @field_validator("reply")
    @classmethod
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Reply cannot be empty")
        return v.strip()


class MessageStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in VALID_STATUSES:
            raise ValueError(f"Status must be one of {VALID_STATUSES}")
        return v


class MessageOut(BaseModel):
    id: int
    user_id: int
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    category: str
    reference: Optional[str] = None
    subject: str
    body: str
    status: str
    admin_reply: Optional[str] = None
    replied_by_name: Optional[str] = None
    replied_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True