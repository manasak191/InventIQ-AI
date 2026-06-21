from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductCreate(BaseModel):
    sku: str
    name: str
    category: Optional[str] = None
    stock: int = 0
    reorder_point: int = 10
    price: float = 0
    warehouse: Optional[str] = None
    supplier_id: Optional[int] = None


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    reorder_point: Optional[int] = None
    price: Optional[float] = None
    warehouse: Optional[str] = None
    supplier_id: Optional[int] = None


class ProductOut(BaseModel):
    id: int
    sku: str
    name: str
    category: Optional[str] = None
    stock: int
    reorder_point: int
    price: float
    warehouse: Optional[str] = None
    status: str

    class Config:
        from_attributes = True
