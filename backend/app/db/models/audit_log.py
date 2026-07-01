# backend/app/db/models/audit_log.py
"""
Generic audit log model.

This table records ANY create/update/delete action across ANY module
(products, suppliers, users, warehouses, etc). It is separate from the
`Transaction` table, which only tracks stock IN/OUT/TRF movements.

Together, Transaction + AuditLog give you a full system-wide history.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, func
from app.db.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Which module/table was affected: "product", "supplier", "user", "warehouse"
    module = Column(String, nullable=False, index=True)

    # What happened: "CREATE", "UPDATE", "DELETE"
    action = Column(String, nullable=False, index=True)

    # The id of the affected record (e.g. product_id, supplier_id, user_id)
    record_id = Column(Integer, nullable=True)

    # Human-readable label of the record, e.g. product name / supplier name
    record_label = Column(String, nullable=True)

    # Optional free-text detail, e.g. "stock changed from 10 to 50"
    detail = Column(Text, nullable=True)

    # Who performed the action
    user_id = Column(Integer, nullable=True)
    user_name = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())