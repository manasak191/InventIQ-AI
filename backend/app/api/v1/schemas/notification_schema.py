from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class NotificationOut(BaseModel):
    id: int
    type: str
    icon: Optional[str] = None
    message: str
    source: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LowStockAlertRequest(BaseModel):
    product_ids: List[int]
