from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class OrderCreate(BaseModel):
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    product_id: Optional[int] = None
    sku: Optional[str] = None
    qty: int
    total_value: float = 0


class OrderOut(BaseModel):
    id: int
    order_number: str
    supplier_name: Optional[str] = None
    sku: Optional[str] = None
    qty: int
    total_value: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
