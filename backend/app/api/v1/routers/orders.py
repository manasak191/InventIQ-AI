import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.order import Order
from app.core.deps import get_current_user, require_admin
from app.api.v1.schemas.order_schema import OrderCreate

router = APIRouter(prefix="/orders", tags=["Purchase Orders"])


def serialize(o: Order) -> dict:
    return {
        "id": o.id,
        "order_number": o.order_number,
        "supplier_name": o.supplier_name,
        "sku": o.sku,
        "qty": o.qty,
        "total_value": o.total_value,
        "status": o.status,
        "created_at": o.created_at,
    }


@router.get("")
def list_orders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    orders = db.query(Order).order_by(Order.id.desc()).all()
    return [serialize(o) for o in orders]


@router.post("")
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    order_number = f"PO-{random.randint(1000,9999)}"
    order = Order(order_number=order_number, status="pending", **payload.dict())
    db.add(order)
    db.commit()
    db.refresh(order)
    return serialize(order)


@router.patch("/{order_id}/approve")
def approve_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "approved"
    db.commit()
    return serialize(order)


@router.patch("/{order_id}/reject")
def reject_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "rejected"
    db.commit()
    return serialize(order)
