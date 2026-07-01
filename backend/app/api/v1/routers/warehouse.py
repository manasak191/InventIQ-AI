# backend/app/api/v1/routers/warehouse.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db.models.warehouse import Warehouse
from app.db.models.product import Product
from app.core.deps import get_current_user, require_admin
from app.api.v1.schemas.warehouse_schema import WarehouseCreate, WarehouseUpdate
from app.services.audit_service import log_action

router = APIRouter(prefix="/inventory/warehouses", tags=["Warehouses"])


def serialize(w: Warehouse, db: Session) -> dict:
    products = db.query(Product).filter(Product.warehouse_id == w.id).all()
    total_stock = sum(p.stock or 0 for p in products)
    total_value = sum((p.stock or 0) * (p.price or 0) for p in products)
    sku_count = len(products)
    low_stock_count = sum(1 for p in products if (p.stock or 0) <= (p.reorder_point or 0))
    remaining_capacity = max((w.max_capacity or 0) - total_stock, 0)
    utilization_pct = round((total_stock / w.max_capacity) * 100, 1) if w.max_capacity else 0

    return {
        "id": w.id, "name": w.name, "code": w.code, "address": w.address,
        "city": w.city, "state": w.state, "country": w.country,
        "manager_name": w.manager_name, "contact_number": w.contact_number,
        "email": w.email, "max_capacity": w.max_capacity,
        "current_capacity": total_stock, "remaining_capacity": remaining_capacity,
        "utilization_pct": utilization_pct, "status": w.status,
        "sku_count": sku_count, "total_stock": total_stock,
        "total_value": total_value, "low_stock_count": low_stock_count,
        "created_at": w.created_at, "updated_at": w.updated_at,
        "warehouse": w.name,
    }


# ---- RESTORED: these two GET endpoints were missing in the previous file ----

@router.get("")
def list_warehouses(
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Warehouse)
    if search:
        q = q.filter(
            Warehouse.name.ilike(f"%{search}%")
            | Warehouse.city.ilike(f"%{search}%")
            | Warehouse.manager_name.ilike(f"%{search}%")
        )
    if status:
        q = q.filter(Warehouse.status == status)
    warehouses = q.order_by(Warehouse.id.desc()).all()
    return [serialize(w, db) for w in warehouses]


@router.get("/{warehouse_id}")
def get_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return serialize(w, db)


@router.post("")
def create_warehouse(
    payload: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing = db.query(Warehouse).filter(
        (Warehouse.name == payload.name) | (Warehouse.code == payload.code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Warehouse name or code already exists")

    warehouse = Warehouse(**payload.model_dump())
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)

    log_action(
        db, module="warehouse", action="CREATE",
        record_id=warehouse.id, record_label=warehouse.name,
        user=current_user, detail=f"Created warehouse: {warehouse.name} ({warehouse.code})"
    )

    return serialize(warehouse, db)


@router.put("/{warehouse_id}")
def update_warehouse(
    warehouse_id: int,
    payload: WarehouseUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    data = payload.model_dump(exclude_unset=True)

    if "name" in data or "code" in data:
        dup = db.query(Warehouse).filter(
            Warehouse.id != warehouse_id,
            (
                (Warehouse.name == data.get("name", warehouse.name))
                | (Warehouse.code == data.get("code", warehouse.code))
            ),
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="Warehouse name or code already exists")

    old_capacity = warehouse.max_capacity

    for field, value in data.items():
        setattr(warehouse, field, value)

    db.commit()
    db.refresh(warehouse)

    log_action(
        db, module="warehouse", action="UPDATE",
        record_id=warehouse.id, record_label=warehouse.name,
        user=current_user,
        detail=f"Updated warehouse (capacity {old_capacity} → {warehouse.max_capacity})"
    )

    return serialize(warehouse, db)


@router.delete("/{warehouse_id}")
def delete_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    in_use = db.query(Product).filter(Product.warehouse_id == warehouse_id).count()
    if in_use > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete: {in_use} product(s) still assigned to this warehouse",
        )

    label = warehouse.name
    db.delete(warehouse)
    db.commit()

    log_action(
        db, module="warehouse", action="DELETE",
        record_id=warehouse_id, record_label=label,
        user=current_user, detail="Warehouse permanently deleted"
    )

    return {"message": "Warehouse deleted"}