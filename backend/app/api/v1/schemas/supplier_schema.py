from pydantic import BaseModel
from typing import Optional


class SupplierCreate(BaseModel):
    name: str
    category: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: str = "active"


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    rating: Optional[float] = None
    orders: Optional[int] = None
    on_time_percent: Optional[float] = None
    total_value: Optional[float] = None


class SupplierOut(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    rating: float
    orders: int
    on_time_percent: float
    total_value: float
    status: str

    class Config:
        from_attributes = True
