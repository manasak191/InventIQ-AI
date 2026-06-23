from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from typing import Optional
from datetime import datetime


class WarehouseBase(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    manager_name: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[EmailStr] = None
    max_capacity: float
    status: Optional[str] = "active"

    @field_validator("max_capacity")
    @classmethod
    def capacity_must_be_positive(cls, v):
        if v < 0:
            raise ValueError("Maximum capacity cannot be negative")
        return v

    @field_validator("contact_number")
    @classmethod
    def validate_phone(cls, v):
        if v is None or v == "":
            return v
        digits = "".join(ch for ch in v if ch.isdigit())
        if len(digits) < 7 or len(digits) > 15:
            raise ValueError("Invalid contact number")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in ("active", "inactive"):
            raise ValueError("Status must be 'active' or 'inactive'")
        return v

    @field_validator("name", "code")
    @classmethod
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("This field cannot be empty")
        return v.strip()


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    manager_name: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[EmailStr] = None
    max_capacity: Optional[float] = None
    status: Optional[str] = None

    @field_validator("max_capacity")
    @classmethod
    def capacity_must_be_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError("Maximum capacity cannot be negative")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v is not None and v not in ("active", "inactive"):
            raise ValueError("Status must be 'active' or 'inactive'")
        return v


class WarehouseOut(WarehouseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None