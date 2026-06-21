from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TransactionCreate(BaseModel):
    type: str  # IN | OUT | TRF
    sku: str
    product_name: Optional[str] = None
    qty: int
    value: float = 0
    warehouse: Optional[str] = None
    note: Optional[str] = None
    product_id: Optional[int] = None


class TransactionOut(BaseModel):
    id: int
    type: str
    sku: str
    product_name: Optional[str] = None
    qty: int
    value: float
    warehouse: Optional[str] = None
    note: Optional[str] = None
    user_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
