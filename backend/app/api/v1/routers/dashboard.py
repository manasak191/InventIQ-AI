from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta, timezone

from app.db.database import get_db
from app.db.models.product import Product
from app.db.models.transaction import Transaction
from app.db.models.supplier import Supplier
from app.db.models.order import Order
from app.db.models.user import User
from app.db.models.notification import Notification
from app.core.deps import get_current_user, require_admin

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def get_today():
    return datetime.now(timezone.utc).date()


# ── ADMIN KPIs ────────────────────────────────────────────────
@router.get("/admin-kpis")
def admin_kpis(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    today      = get_today()
    products   = db.query(Product).all()
    suppliers  = db.query(Supplier).all()
    orders     = db.query(Order).all()
    txns       = db.query(Transaction).all()

    # Exclude the currently logged-in admin from user counts
    # Count all users, including the logged-in admin
    all_users = db.query(User).all()

    total_users = len(all_users)
    active_users = len([u for u in all_users if u.is_active])
    admin_users = len([u for u in all_users if u.role.lower() == "admin"])

    total_stock_value = sum(p.stock * p.price for p in products)

    # Revenue this month = OUT transaction values this month
    now = datetime.now(timezone.utc)
    revenue_this_month = sum(
        t.value for t in txns
        if t.type == "OUT"
        and t.created_at
        and t.created_at.month == now.month
        and t.created_at.year == now.year
    )

    # Today stock in / out
    today_in  = sum(t.qty for t in txns if t.type == "IN"  and t.created_at and t.created_at.date() == today)
    today_out = sum(t.qty for t in txns if t.type == "OUT" and t.created_at and t.created_at.date() == today)

    # Low / critical stock
    low_stock = [p for p in products if p.stock <= p.reorder_point]
    critical  = [p for p in products if p.stock <= p.reorder_point * 0.5]

    # Top selling products by OUT qty
    product_sales = {}
    for t in txns:
        if t.type == "OUT" and t.sku:
            product_sales.setdefault(t.sku, {"name": t.product_name or t.sku, "units_sold": 0, "revenue": 0.0})
            product_sales[t.sku]["units_sold"] += t.qty
            product_sales[t.sku]["revenue"]    += t.value
    top_products = sorted(product_sales.values(), key=lambda x: x["units_sold"], reverse=True)[:5]

    # Recent system activity (last 5 transactions)
    recent_txns = sorted(txns, key=lambda t: t.created_at or datetime.min, reverse=True)[:5]
    recent_activity = [
        {
            "icon": "📦" if t.type == "IN" else "🚚" if t.type == "OUT" else "🔄",
            "text": f"{'Stock IN' if t.type=='IN' else 'Stock OUT' if t.type=='OUT' else 'Transfer'} — {t.product_name or t.sku}",
            "by":   t.user_name or "System",
            "time": t.created_at.strftime("%I:%M %p") if t.created_at else "",
        }
        for t in recent_txns
    ]

    # Warehouse stats
    wh_map = {}
    for p in products:
        wh = p.warehouse or "Unassigned"
        wh_map.setdefault(wh, {"sku_count": 0, "total_stock": 0, "total_value": 0.0})
        wh_map[wh]["sku_count"]   += 1
        wh_map[wh]["total_stock"] += p.stock
        wh_map[wh]["total_value"] += p.stock * p.price
    warehouses = [{"warehouse": k, **v} for k, v in wh_map.items()]

    # Category breakdown for donut
    cat_map = {}
    for p in products:
        c = p.category or "Other"
        cat_map.setdefault(c, 0.0)
        cat_map[c] += p.stock * p.price
    categories = [{"name": k, "value": round(v / 100000, 1)} for k, v in cat_map.items()]

    return {
        "total_revenue_this_month": revenue_this_month,
        "total_products":           len(products),
        "total_stock_value":        total_stock_value,
        "low_stock_alerts":         len(low_stock),
        "critical_alerts":          len(critical),
        "total_users":              total_users,
        "active_users":             active_users,
        "total_suppliers":          len(suppliers),
        "pending_orders":           len([o for o in orders if o.status == "pending"]),
        "today_stock_in":           today_in,
        "today_stock_out":          today_out,
        "top_products":             top_products,
        "recent_activity":          recent_activity,
        "warehouses":               warehouses,
        "categories":               categories,
    }


# ── USER KPIs ─────────────────────────────────────────────────
@router.get("/user-kpis")
def user_kpis(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    today    = get_today()
    products = db.query(Product).all()
    all_txns = db.query(Transaction).all()
    my_txns  = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()

    # Today across all users (for stock-in / stock-out counts)
    today_in  = sum(t.qty for t in all_txns if t.type == "IN"  and t.created_at and t.created_at.date() == today)
    today_out = sum(t.qty for t in all_txns if t.type == "OUT" and t.created_at and t.created_at.date() == today)

    # This week — my transactions
    week_start = datetime.now(timezone.utc) - timedelta(days=7)
    my_week_txns = [t for t in my_txns if t.created_at and t.created_at >= week_start]

    # Low stock items for alerts
    low_stock = [p for p in products if p.stock <= p.reorder_point]

    # Recent MY transactions (last 4)
    recent_mine = sorted(my_txns, key=lambda t: t.created_at or datetime.min, reverse=True)[:4]
    recent = [
        {
            "id":        t.id,
            "type":      t.type,
            "sku":       t.sku,
            "product":   t.product_name,
            "qty":       t.qty,
            "warehouse": t.warehouse,
            "time":      t.created_at.strftime("%I:%M %p") if t.created_at else "",
            "date":      t.created_at.strftime("%Y-%m-%d") if t.created_at else "",
            "status":    "Completed",
        }
        for t in recent_mine
    ]

    # Stock alerts
    stock_alerts = [
        {
            "sku":           p.sku,
            "name":          p.name,
            "stock":         p.stock,
            "reorder_point": p.reorder_point,
            "warehouse":     p.warehouse or "—",
            "status":        "critical" if p.stock <= p.reorder_point * 0.5 else "low",
        }
        for p in low_stock[:5]
    ]

    # Pending orders assigned to / created by this user
    pending_orders = db.query(Order).filter(Order.status == "pending").count()

    return {
        "today_stock_in":      today_in,
        "today_stock_out":     today_out,
        "my_transactions":     len(my_txns),
        "my_week_txns":        len(my_week_txns),
        "low_stock_alerts":    len(low_stock),
        "assigned_products":   len(products),
        "pending_orders":      pending_orders,
        "recent_transactions": recent,
        "stock_alerts":        stock_alerts,
    }


# ── WAREHOUSE STATS ───────────────────────────────────────────
@router.get("/warehouses")
def warehouse_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    products = db.query(Product).all()
    txns     = db.query(Transaction).all()
    warehouses = {}

    for p in products:
        wh = p.warehouse or "Unassigned"
        warehouses.setdefault(wh, {
            "sku_count": 0, "total_stock": 0,
            "total_value": 0.0, "low_stock_count": 0,
            "monthly_in": [0]*12, "monthly_out": [0]*12,
        })
        warehouses[wh]["sku_count"]   += 1
        warehouses[wh]["total_stock"] += p.stock
        warehouses[wh]["total_value"] += p.stock * p.price
        if p.stock <= p.reorder_point:
            warehouses[wh]["low_stock_count"] += 1

    for t in txns:
        wh = t.warehouse or "Unassigned"
        if wh in warehouses and t.created_at:
            m = t.created_at.month - 1
            if t.type == "IN":
                warehouses[wh]["monthly_in"][m]  += t.qty
            elif t.type == "OUT":
                warehouses[wh]["monthly_out"][m] += t.qty

    return [{"warehouse": k, **v} for k, v in warehouses.items()]


# ── GLOBAL SEARCH ─────────────────────────────────────────────
@router.get("/search")
def global_search(
    q: str = "",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not q or len(q.strip()) < 2:
        return {"results": [], "total": 0}

    term = f"%{q.strip().lower()}%"
    results = []

    # Products / SKU
    products = db.query(Product).filter(
        (Product.name.ilike(term)) | (Product.sku.ilike(term)) | (Product.category.ilike(term))
    ).limit(5).all()
    for p in products:
        results.append({
            "type": "product", "icon": "📦",
            "title": p.name,
            "subtitle": f"SKU: {p.sku} · {p.category} · Stock: {p.stock}",
            "id": p.id, "page": "products",
        })

    # Suppliers
    suppliers = db.query(Supplier).filter(
        (Supplier.name.ilike(term)) | (Supplier.category.ilike(term))
    ).limit(3).all()
    for s in suppliers:
        results.append({
            "type": "supplier", "icon": "🤝",
            "title": s.name,
            "subtitle": f"{s.category} · {s.status}",
            "id": s.id, "page": "suppliers",
        })

    # Transactions
    txns = db.query(Transaction).filter(
        (Transaction.sku.ilike(term)) | (Transaction.product_name.ilike(term))
    ).limit(3).all()
    for t in txns:
        results.append({
            "type": "transaction", "icon": "🔄",
            "title": f"{t.type} — {t.product_name or t.sku}",
            "subtitle": f"Qty: {t.qty} · {t.warehouse}",
            "id": t.id, "page": "transactions",
        })

    # Users — admin only, exclude self
    if current_user.role == "admin":
        users = db.query(User).filter(
            User.id != current_user.id,
        ).filter(
            (User.first_name.ilike(term)) |
            (User.last_name.ilike(term))  |
            (User.email.ilike(term))
        ).limit(3).all()
        for u in users:
            results.append({
                "type": "user", "icon": "👤",
                "title": f"{u.first_name} {u.last_name}",
                "subtitle": f"{u.email} · {u.role}",
                "id": u.id, "page": "users",
            })

    return {"results": results, "total": len(results)}