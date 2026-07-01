# backend/app/api/v1/routers/history.py
"""
Unified system-wide history.

Combines:
  - Transaction table  -> stock IN / OUT / TRF events
  - AuditLog table      -> product / supplier / user / warehouse changes

so the History page can show EVERYTHING, not just stock transactions.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db.models.transaction import Transaction
from app.db.models.audit_log import AuditLog
from app.core.deps import require_admin

router = APIRouter(prefix="/history", tags=["History"])


@router.get("")
def get_history(
    module: Optional[str] = None,   # "transaction" | "product" | "supplier" | "user" | "warehouse" | None=all
    type: Optional[str] = None,     # IN | OUT | TRF  (only applies to transactions)
    user_id: Optional[int] = None,
    sku: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    events = []

    # ---- Transactions (stock movements) ----
    if module in (None, "transaction"):
        q = db.query(Transaction)
        if type:
            q = q.filter(Transaction.type == type)
        if user_id:
            q = q.filter(Transaction.user_id == user_id)
        if sku:
            q = q.filter(Transaction.sku.ilike(f"%{sku}%"))

        for t in q.all():
            events.append({
                "source":      "transaction",
                "module":      "transaction",
                "type":        t.type,             # IN / OUT / TRF
                "sku":         t.sku,
                "product":     t.product_name,
                "qty":         t.qty,
                "value":       t.value,
                "warehouse":   t.warehouse,
                "note":        t.note,
                "user":        t.user_name,
                "user_id":     t.user_id,
                "timestamp":   t.created_at,
            })

    # ---- Everything else (products, suppliers, users, warehouses) ----
    if module in (None, "product", "supplier", "user", "warehouse"):
        q = db.query(AuditLog)
        if module:
            q = q.filter(AuditLog.module == module)
        if user_id:
            q = q.filter(AuditLog.user_id == user_id)

        for a in q.all():
            events.append({
                "source":      "audit_log",
                "module":      a.module,           # product / supplier / user / warehouse
                "type":        a.action,           # CREATE / UPDATE / DELETE
                "record_id":   a.record_id,
                "label":       a.record_label,
                "detail":      a.detail,
                "user":        a.user_name,
                "user_id":     a.user_id,
                "timestamp":   a.created_at,
            })

    # ---- Merge + sort everything by time, newest first ----
    events.sort(key=lambda e: e["timestamp"] or 0, reverse=True)

    for e in events:
        ts = e["timestamp"]
        e["date"] = ts.strftime("%Y-%m-%d") if ts else None
        e["time"] = ts.strftime("%I:%M %p") if ts else None
        e["timestamp"] = ts.isoformat() if ts else None

    return events


@router.get("/summary")
def history_summary(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    txns = db.query(Transaction).all()
    logs = db.query(AuditLog).all()

    user_activity = {}

    def bump(name, key):
        user_activity.setdefault(name, {"in": 0, "out": 0, "trf": 0, "other": 0, "total": 0})
        user_activity[name]["total"] += 1
        user_activity[name][key] += 1

    for t in txns:
        name = t.user_name or "Unknown"
        if t.type == "IN":
            bump(name, "in")
        elif t.type == "OUT":
            bump(name, "out")
        elif t.type == "TRF":
            bump(name, "trf")

    for a in logs:
        name = a.user_name or "Unknown"
        bump(name, "other")

    top_users = sorted(
        [{"user": k, **v} for k, v in user_activity.items()],
        key=lambda x: x["total"], reverse=True
    )[:5]

    # Per-module breakdown (NEW)
    module_counts = {}
    for a in logs:
        module_counts[a.module] = module_counts.get(a.module, 0) + 1

    return {
        "total_events":     len(txns) + len(logs),
        "transaction_events": len(txns),
        "in_events":        len([t for t in txns if t.type == "IN"]),
        "out_events":       len([t for t in txns if t.type == "OUT"]),
        "trf_events":       len([t for t in txns if t.type == "TRF"]),
        "audit_events":     len(logs),
        "module_breakdown": module_counts,   # e.g. {"product": 12, "supplier": 4, "user": 2}
        "top_users":        top_users,
        "unique_users":     len(user_activity),
    }