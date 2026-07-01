from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.services.audit_service import log_action
from app.core.deps import get_current_user, require_admin

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
        
        "orders": s.orders,
        
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
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    new_supplier = Supplier(**payload.dict())
    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)
 
    # 👇 NEW: log it
    log_action(
        db, module="supplier", action="CREATE",
        record_id=new_supplier.id, record_label=new_supplier.name,
        user=current_user, detail=f"Created supplier: {new_supplier.name}"
    )
 
    return new_supplier
 
 
@router.put("/{supplier_id}")
def update_supplier(supplier_id: int, payload: SupplierUpdate, db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    old_rating = supplier.rating  # example: track what changed
 
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(supplier, field, value)
    db.commit()
    db.refresh(supplier)
 
    # 👇 NEW: log it
    log_action(
        db, module="supplier", action="UPDATE",
        record_id=supplier.id, record_label=supplier.name,
        user=current_user,
        detail=f"Updated supplier details (rating {old_rating} → {supplier.rating})"
    )
 
    return supplier
 
 
@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db),
                     current_user=Depends(require_admin)):  # delete = admin only
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    label = supplier.name
 
    db.delete(supplier)
    db.commit()
 
    # 👇 NEW: log it
    log_action(
        db, module="supplier", action="DELETE",
        record_id=supplier_id, record_label=label,
        user=current_user, detail="Supplier permanently deleted"
    )
 
    return {"message": "Supplier deleted"}
