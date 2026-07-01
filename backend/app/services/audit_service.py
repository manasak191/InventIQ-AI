# backend/app/services/audit_service.py
"""
Call log_action(...) from any router (products, suppliers, users, warehouses)
right after a create/update/delete commit, to record it in the audit trail.

Example usage inside a router:

    from app.services.audit_service import log_action

    log_action(
        db,
        module="product",
        action="CREATE",
        record_id=new_product.id,
        record_label=new_product.name,
        user=current_user,
        detail=f"Created product with SKU {new_product.sku}",
    )
"""

from sqlalchemy.orm import Session
from app.db.models.audit_log import AuditLog


def log_action(
    db: Session,
    module: str,
    action: str,
    record_id: int = None,
    record_label: str = None,
    user=None,
    detail: str = None,
):
    entry = AuditLog(
        module=module,
        action=action,
        record_id=record_id,
        record_label=record_label,
        detail=detail,
        user_id=getattr(user, "id", None),
        user_name=getattr(user, "name", None) or getattr(user, "email", None),
    )
    db.add(entry)
    db.commit()