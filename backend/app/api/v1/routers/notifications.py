import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.notification import Notification
from app.db.models.product import Product
from app.db.models.user import User
from app.core.deps import get_current_user
from app.api.v1.schemas.notification_schema import LowStockAlertRequest
from app.services.email_service import send_low_stock_alert_email

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def serialize(n: Notification) -> dict:
    return {
        "id": n.id,
        "type": n.type,
        "icon": n.icon,
        "message": n.message,
        "source": n.source,
        "read": n.read,
        "time": n.created_at.strftime("%Y-%m-%d %H:%M") if n.created_at else None,
        "created_at": n.created_at,
    }


@router.get("")
def list_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notifications = db.query(Notification).order_by(Notification.id.desc()).all()
    return [serialize(n) for n in notifications]


@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.read = True
    db.commit()
    return serialize(n)


@router.patch("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db.query(Notification).update({Notification.read: True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(n)
    db.commit()
    return {"message": "Notification deleted", "id": notification_id}


@router.delete("")
def delete_all_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Bulk-delete all read notifications (keeps unread ones intact)."""
    deleted = db.query(Notification).filter(Notification.read == True).delete()
    db.commit()
    return {"message": f"Deleted {deleted} read notification(s)"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(n)
    db.commit()
    return {"message": "Notification deleted", "id": notification_id}


@router.delete("")
def delete_all_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    deleted = db.query(Notification).filter(Notification.read == True).delete()
    db.commit()
    return {"message": f"Deleted {deleted} read notification(s)"}


@router.post("/low-stock-alert")
def send_low_stock_alert(
    payload: LowStockAlertRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Sends a low-stock email to all admin users and creates a notification record.
    Deduplicates: if an identical, still-unread alert already exists for a product
    (same SKU + same stock count + same reorder point), it's skipped — no repeat
    email, no repeat notification — until the stock level actually changes.
    """
    products = db.query(Product).filter(Product.id.in_(payload.product_ids)).all()
    if not products:
        raise HTTPException(status_code=404, detail="No matching products found")

    # Build the exact message each product WOULD generate, then check which ones
    # already exist (unread) — those are skipped entirely, no email, no new row.
    new_products = []
    skipped_skus = []
    for p in products:
        message = f"{p.sku} low stock — {p.stock} units left (reorder point: {p.reorder_point})"
        already_alerted = (
            db.query(Notification)
            .filter(Notification.message == message, Notification.read == False)
            .first()
        )
        if already_alerted:
            skipped_skus.append(p.sku)
        else:
            new_products.append(p)

    if not new_products:
        return {
            "message": "No new alerts — all selected products were already alerted and unread.",
            "sent_to": [],
            "products": [],
            "skipped_skus": skipped_skus,
        }

    product_dicts = [
        {"sku": p.sku, "name": p.name, "stock": p.stock, "reorder_point": p.reorder_point}
        for p in new_products
    ]

    # Find all admin users to notify
    admins = db.query(User).filter(User.role == "admin", User.is_active == True).all()
    fallback_admin_email = os.getenv("EMAIL_USER")  # send to self if no admin accounts exist yet

    sent_to = []
    targets = [a.email for a in admins] or ([fallback_admin_email] if fallback_admin_email else [])

    for email in targets:
        success = send_low_stock_alert_email(email, product_dicts)
        if success:
            sent_to.append(email)

    # Create an in-app notification record only for genuinely new alerts
    for p in new_products:
        notif = Notification(
            type="critical" if p.stock <= p.reorder_point * 0.5 else "warning",
            icon="🚨" if p.stock <= p.reorder_point * 0.5 else "⚠️",
            message=f"{p.sku} low stock — {p.stock} units left (reorder point: {p.reorder_point})",
            source="System",
            read=False,
        )
        db.add(notif)
    db.commit()

    return {
        "message": f"Low stock alert sent for {len(new_products)} product(s)",
        "sent_to": sent_to,
        "products": product_dicts,
        "skipped_skus": skipped_skus,
    }