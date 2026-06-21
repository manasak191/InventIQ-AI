from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db.models.supplier import Supplier
from app.core.deps import get_current_user
from app.api.v1.schemas.supplier_schema import SupplierCreate, SupplierUpdate

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


def serialize(s: Supplier) -> dict:
    return {
        "id": s.id,
        "name": s.name,
        "category": s.category,
        "email": s.email,
        "phone": s.phone,
        "rating": s.rating,
        "orders": s.orders,
        "on_time_percent": s.on_time_percent,
        "total_value": s.total_value,
        "status": s.status,
    }


@router.get("")
def list_suppliers(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Supplier)
    if search:
        q = q.filter(Supplier.name.ilike(f"%{search}%"))
    suppliers = q.order_by(Supplier.id.desc()).all()
    return [serialize(s) for s in suppliers]


@router.get("/{supplier_id}")
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return serialize(s)


@router.post("")
def create_supplier(
    payload: SupplierCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    supplier = Supplier(**payload.dict())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return serialize(supplier)


@router.put("/{supplier_id}")
def update_supplier(
    supplier_id: int,
    payload: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(supplier, field, value)

    db.commit()
    db.refresh(supplier)
    return serialize(supplier)


@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    db.delete(supplier)
    db.commit()
    return {"message": "Supplier removed"}
