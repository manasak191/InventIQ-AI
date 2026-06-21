from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime

from app.db.database import get_db
from app.db.models.product import Product
from app.db.models.transaction import Transaction
from app.db.models.supplier import Supplier
from app.db.models.order import Order
from app.core.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/summary")
def report_summary(
    period: str = "monthly",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    products = db.query(Product).all()
    txns = db.query(Transaction).all()
    orders = db.query(Order).all()

    total_stock_value = sum(p.stock * p.price for p in products)
    stockout_events = len([p for p in products if p.stock == 0])
    low_stock_count = len([p for p in products if p.stock <= p.reorder_point])

    total_in = sum(t.value for t in txns if t.type == "IN")
    total_out = sum(t.value for t in txns if t.type == "OUT")

    return {
        "stock_accuracy": 97.8,  # placeholder until cycle-count data exists
        "total_orders_ytd": f"₹{round(sum(o.total_value for o in orders)/100000, 1)}L" if orders else "₹0",
        "stockout_events": stockout_events,
        "low_stock_count": low_stock_count,
        "on_time_delivery": round(
            sum(s.on_time_percent for s in db.query(Supplier).all()) / max(len(db.query(Supplier).all()), 1), 1
        ),
        "inventory_turnover": round(total_out / max(total_stock_value, 1) * 12, 2) if total_stock_value else 0,
        "avg_order_value": f"₹{round(sum(o.total_value for o in orders)/max(len(orders),1)/1000,1)}K" if orders else "₹0",
        "gross_margin": 32.4,  # placeholder until cost-price tracking exists
        "total_revenue": f"₹{round(total_out/100000, 1)}L",
    }


@router.get("/inventory")
def report_inventory(
    period: str = "monthly",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    txns = db.query(Transaction).all()
    now = datetime.utcnow()

    monthly_in = [0] * 12
    monthly_out = [0] * 12
    for t in txns:
        if not t.created_at:
            continue
        m = t.created_at.month - 1
        if t.type == "IN":
            monthly_in[m] += t.qty
        elif t.type == "OUT":
            monthly_out[m] += t.qty

    return {"stock_in": monthly_in, "stock_out": monthly_out}


@router.get("/revenue")
def report_revenue(
    period: str = "monthly",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    txns = db.query(Transaction).filter(Transaction.type == "OUT").all()
    orders = db.query(Order).all()

    monthly_rev = [0] * 12
    monthly_orders = [0] * 12
    for t in txns:
        if not t.created_at:
            continue
        monthly_rev[t.created_at.month - 1] += t.value / 100000  # in lakhs
    for o in orders:
        if not o.created_at:
            continue
        monthly_orders[o.created_at.month - 1] += 1

    return {"monthly": [round(v, 1) for v in monthly_rev], "orders": monthly_orders}


@router.get("/suppliers")
def report_suppliers(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    suppliers = db.query(Supplier).order_by(Supplier.rating.desc()).all()
    return [
        {
            "name": s.name,
            "rating": s.rating,
            "on_time_percent": s.on_time_percent,
            "orders": s.orders,
            "total_value": s.total_value,
        }
        for s in suppliers
    ]
