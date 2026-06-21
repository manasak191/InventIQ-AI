from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.product import Product
from app.db.models.transaction import Transaction
from app.db.models.supplier import Supplier
from app.db.models.order import Order
from app.db.models.user import User
from app.core.deps import get_current_user, require_admin

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/user-kpis")
def user_kpis(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    products = db.query(Product).all()
    txns = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()

    return {
        "assigned_products": len(products),
        "low_stock_alerts": len([p for p in products if p.stock <= p.reorder_point]),
        "my_transactions": len(txns),
        "pending_orders": db.query(Order).filter(Order.status == "pending").count(),
    }


@router.get("/admin-kpis")
def admin_kpis(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    products = db.query(Product).all()
    suppliers = db.query(Supplier).all()
    orders = db.query(Order).all()
    users = db.query(User).all()

    total_stock_value = sum(p.stock * p.price for p in products)

    return {
        "total_products": len(products),
        "total_stock_value": total_stock_value,
        "critical_alerts": len([p for p in products if p.stock <= p.reorder_point * 0.5]),
        "total_suppliers": len(suppliers),
        "pending_orders": len([o for o in orders if o.status == "pending"]),
        "total_users": len(users),
        "active_users": len([u for u in users if u.is_active]),
    }


@router.get("/warehouses")
def warehouse_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    products = db.query(Product).all()
    warehouses = {}
    for p in products:
        wh = p.warehouse or "Unassigned"
        warehouses.setdefault(wh, {"sku_count": 0, "total_stock": 0, "total_value": 0})
        warehouses[wh]["sku_count"] += 1
        warehouses[wh]["total_stock"] += p.stock
        warehouses[wh]["total_value"] += p.stock * p.price

    return [{"warehouse": k, **v} for k, v in warehouses.items()]
