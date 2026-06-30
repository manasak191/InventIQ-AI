from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
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
    products  = db.query(Product).all()
    txns      = db.query(Transaction).all()
    orders    = db.query(Order).all()
    suppliers = db.query(Supplier).all()

    total_products    = len(products)
    total_stock_value = sum(p.stock * p.price for p in products)

    # Stockout = products with stock exactly 0
    stockout_events = len([p for p in products if p.stock == 0])
    low_stock_count = len([p for p in products if p.stock <= p.reorder_point])

    # ── Stock Accuracy ─────────────────────────────────────────
    # ONLY calculate if products exist. If no products → None (not 97.8%)
    if total_products > 0:
        healthy = len([p for p in products if p.stock > p.reorder_point])
        stock_accuracy = round((healthy / total_products) * 100, 1)
    else:
        stock_accuracy = None   # explicitly None — frontend shows N/A

    # ── Revenue & Cost ─────────────────────────────────────────
    total_out_value = sum(t.value for t in txns if t.type == "OUT")
    total_in_value  = sum(t.value for t in txns if t.type == "IN")

    # ── Gross Margin ───────────────────────────────────────────
    # ONLY calculate when we have actual OUT transactions with value > 0.
    # If no transactions → None (not 32.4%)
    if total_out_value > 0 and total_in_value > 0:
        gross_margin = round(
            ((total_out_value - total_in_value) / total_out_value) * 100, 1
        )
    else:
        gross_margin = None   # explicitly None → frontend shows N/A

    # ── Inventory Turnover ─────────────────────────────────────
    if total_stock_value > 0 and total_out_value > 0:
        inventory_turnover = round(
            (total_out_value / total_stock_value) * 12, 2
        )
    else:
        inventory_turnover = None

    # ── On-Time Delivery ───────────────────────────────────────
   

    # ── Orders ─────────────────────────────────────────────────
    total_orders_value = sum(o.total_value for o in orders)
    avg_order_value    = (total_orders_value / len(orders)) if orders else None

    # ── Top Categories ─────────────────────────────────────────
    cat_map = {}
    for p in products:
        c = p.category or "Uncategorized"
        cat_map.setdefault(c, {"stock_value": 0.0, "product_count": 0, "total_stock": 0})
        cat_map[c]["stock_value"]   += p.stock * p.price
        cat_map[c]["product_count"] += 1
        cat_map[c]["total_stock"]   += p.stock
    top_categories = sorted(
        [{"name": k, **v} for k, v in cat_map.items()],
        key=lambda x: x["stock_value"], reverse=True
    )[:6]

    # ── Transaction counts ─────────────────────────────────────
    txn_in  = len([t for t in txns if t.type == "IN"])
    txn_out = len([t for t in txns if t.type == "OUT"])
    txn_trf = len([t for t in txns if t.type == "TRF"])

    return {
        # ── All values are genuinely computed — no hardcoded fallbacks ──
        "total_products":       total_products,
        "total_stock_value":    total_stock_value,
        "stockout_events":      stockout_events,
        "low_stock_count":      low_stock_count,

        # These are None when there's no data — NOT 97.8 / 32.4
        "stock_accuracy":       stock_accuracy,
        "gross_margin":         gross_margin,
        "inventory_turnover":   inventory_turnover,
        

        "total_revenue":        total_out_value,
        "total_in_value":       total_in_value,
        "total_orders":         len(orders),
        "total_orders_value":   total_orders_value,
        "avg_order_value":      avg_order_value,
        "txn_count_in":         txn_in,
        "txn_count_out":        txn_out,
        "txn_count_trf":        txn_trf,
        "total_transactions":   len(txns),
        "top_categories":       top_categories,

        # Flags so frontend knows what data exists
        "has_products":     total_products > 0,
        "has_transactions": len(txns) > 0,
        "has_orders":       len(orders) > 0,
        "has_suppliers":    len(suppliers) > 0,
    }


@router.get("/inventory")
def report_inventory(
    period: str = "monthly",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    txns = db.query(Transaction).all()
    now  = datetime.utcnow()

    if period == "yearly":
        txns = [t for t in txns if t.created_at and t.created_at.year == now.year]
    elif period == "quarterly":
        qsm  = ((now.month - 1) // 3) * 3 + 1
        txns = [t for t in txns if t.created_at and t.created_at.year == now.year and t.created_at.month >= qsm]
    else:
        txns = [t for t in txns if t.created_at and t.created_at.year == now.year]

    monthly_in  = [0] * 12
    monthly_out = [0] * 12
    monthly_trf = [0] * 12
    for t in txns:
        if not t.created_at:
            continue
        m = t.created_at.month - 1
        if t.type == "IN":
            monthly_in[m]  += t.qty
        elif t.type == "OUT":
            monthly_out[m] += t.qty
        elif t.type == "TRF":
            monthly_trf[m] += t.qty

    return {
        "stock_in":       monthly_in,
        "stock_out":      monthly_out,
        "stock_transfer": monthly_trf,
        "has_data":       any(v > 0 for v in monthly_in + monthly_out),
    }


@router.get("/revenue")
def report_revenue(
    period: str = "monthly",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    now      = datetime.utcnow()
    out_txns = db.query(Transaction).filter(Transaction.type == "OUT").all()
    orders   = db.query(Order).all()

    if period == "yearly":
        out_txns = [t for t in out_txns if t.created_at and t.created_at.year == now.year]
        orders   = [o for o in orders   if o.created_at and o.created_at.year == now.year]
    elif period == "quarterly":
        qsm      = ((now.month - 1) // 3) * 3 + 1
        out_txns = [t for t in out_txns if t.created_at and t.created_at.year == now.year and t.created_at.month >= qsm]
        orders   = [o for o in orders   if o.created_at and o.created_at.year == now.year and o.created_at.month >= qsm]
    else:
        out_txns = [t for t in out_txns if t.created_at and t.created_at.year == now.year]
        orders   = [o for o in orders   if o.created_at and o.created_at.year == now.year]

    monthly_rev    = [0.0] * 12
    monthly_orders = [0]   * 12
    for t in out_txns:
        if t.created_at:
            monthly_rev[t.created_at.month - 1] += t.value / 100000
    for o in orders:
        if o.created_at:
            monthly_orders[o.created_at.month - 1] += 1

    return {
        "monthly":  [round(v, 2) for v in monthly_rev],
        "orders":   monthly_orders,
        "has_data": any(v > 0 for v in monthly_rev),
    }


@router.get("/suppliers")
def report_suppliers(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    suppliers = db.query(Supplier).order_by(Supplier.orders.desc()).all()

    return {
        "suppliers": [
            {
                "name": s.name,
                "category": s.category,
                "orders": s.orders,
                "total_value": s.total_value,
                "status": s.status,
            }
            for s in suppliers
        ],
        "has_data": len(suppliers) > 0,
    }