from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.db.database import get_db
from app.db.models.transaction import Transaction
from app.db.models.product import Product
from app.core.deps import require_admin

router = APIRouter(prefix="/history", tags=["History"])


@router.get("")
def get_history(
    type: Optional[str] = None,        # IN | OUT | TRF | None=all
    user_id: Optional[int] = None,
    sku: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),   # admin-only audit log
):
    q = db.query(Transaction)
    if type:
        q = q.filter(Transaction.type == type)
    if user_id:
        q = q.filter(Transaction.user_id == user_id)
    if sku:
        q = q.filter(Transaction.sku.ilike(f"%{sku}%"))

    txns = q.order_by(Transaction.created_at.desc()).all()

    return [
        {
            "id":         t.id,
            "type":       t.type,
            "sku":        t.sku,
            "product":    t.product_name,
            "qty":        t.qty,
            "value":      t.value,
            "warehouse":  t.warehouse,
            "note":       t.note,
            "user":       t.user_name,
            "user_id":    t.user_id,
            "date":       t.created_at.strftime("%Y-%m-%d") if t.created_at else None,
            "time":       t.created_at.strftime("%I:%M %p") if t.created_at else None,
            "timestamp":  t.created_at.isoformat() if t.created_at else None,
        }
        for t in txns
    ]


@router.get("/summary")
def history_summary(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    txns = db.query(Transaction).all()

    # Per-user activity count
    user_activity = {}
    for t in txns:
        name = t.user_name or "Unknown"
        user_activity.setdefault(name, {"in": 0, "out": 0, "trf": 0, "total": 0})
        user_activity[name]["total"] += 1
        if t.type == "IN":
            user_activity[name]["in"] += 1
        elif t.type == "OUT":
            user_activity[name]["out"] += 1
        elif t.type == "TRF":
            user_activity[name]["trf"] += 1

    top_users = sorted(
        [{"user": k, **v} for k, v in user_activity.items()],
        key=lambda x: x["total"], reverse=True
    )[:5]

    return {
        "total_events":  len(txns),
        "in_events":     len([t for t in txns if t.type == "IN"]),
        "out_events":    len([t for t in txns if t.type == "OUT"]),
        "trf_events":    len([t for t in txns if t.type == "TRF"]),
        "top_users":     top_users,
        "unique_users":  len(user_activity),
    }