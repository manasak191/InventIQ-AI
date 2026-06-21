from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.product import Product
from app.db.models.supplier import Supplier
from app.core.deps import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


def build_reply(message: str, db: Session) -> str:
    msg = message.lower()
    products = db.query(Product).all()
    suppliers = db.query(Supplier).all()

    if any(k in msg for k in ["reorder", "restock", "buy"]):
        low = [p for p in products if p.stock <= p.reorder_point]
        if not low:
            return "All products currently have healthy stock levels. No reorders needed right now."
        lines = [f"{p.sku} ({p.name}) — {p.stock} left, reorder point {p.reorder_point}" for p in low[:5]]
        return "Based on current stock levels, these need reordering soon:\n" + "\n".join(lines)

    if any(k in msg for k in ["stockout", "risk", "running out"]):
        critical = [p for p in products if p.stock <= p.reorder_point * 0.5]
        if not critical:
            return "No products are at critical stockout risk right now."
        lines = [f"{p.sku} ({p.name}) — only {p.stock} units left" for p in critical[:5]]
        return "High stockout risk detected for:\n" + "\n".join(lines)

    if any(k in msg for k in ["warehouse", "space", "capacity"]):
        wh = {}
        for p in products:
            w = p.warehouse or "Unassigned"
            wh[w] = wh.get(w, 0) + p.stock
        if not wh:
            return "No warehouse data available yet."
        sorted_wh = sorted(wh.items(), key=lambda x: x[1])
        return f"{sorted_wh[0][0]} currently holds the least stock ({sorted_wh[0][1]} units) — likely has the most free space."

    if any(k in msg for k in ["supplier", "vendor"]):
        if not suppliers:
            return "No supplier data available yet."
        best = max(suppliers, key=lambda s: s.rating)
        return f"{best.name} is your top-rated supplier at {best.rating}★ with {best.on_time_percent}% on-time delivery."

    if any(k in msg for k in ["forecast", "demand", "predict"]):
        return ("Demand forecasting requires at least 60-90 days of transaction history for accurate predictions. "
                "Keep logging transactions and I'll be able to generate trend-based forecasts soon.")

    if any(k in msg for k in ["summarize", "summary", "performance", "this month"]):
        total_value = sum(p.stock * p.price for p in products)
        low_count = len([p for p in products if p.stock <= p.reorder_point])
        return (f"Current inventory snapshot: {len(products)} SKUs tracked, total stock value ₹{total_value:,.0f}. "
                f"{low_count} item(s) need reordering. {len(suppliers)} active suppliers on file.")

    return ("I can help with reorder recommendations, stockout risk, warehouse capacity, supplier performance, "
            "and inventory summaries. Try asking about one of those!")


@router.post("/chat")
def ai_chat(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    message = payload.get("message", "")
    reply = build_reply(message, db)
    return {"response": reply}


@router.get("/forecast/{sku_id}")
def ai_forecast(
    sku_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    product = db.query(Product).filter(Product.sku == sku_id).first()
    if not product:
        return {"message": "Product not found", "forecast": None}
    return {
        "sku": product.sku,
        "current_stock": product.stock,
        "message": "Forecasting requires more historical transaction data for this SKU.",
    }
