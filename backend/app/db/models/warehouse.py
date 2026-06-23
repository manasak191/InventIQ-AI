# Save this as: app/db/models/warehouse.py

from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    code = Column(String, nullable=False, unique=True, index=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    manager_name = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    email = Column(String, nullable=True)
    max_capacity = Column(Float, nullable=False, default=0)
    status = Column(String, nullable=False, default="active")  # "active" | "inactive"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ---------------------------------------------------------------------------
# ALSO REQUIRED: add ONE line to your existing app/db/models/product.py
# Inside the Product class, add:
#
#     warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
#
# (make sure ForeignKey is imported from sqlalchemy at the top of that file)
#
# Your existing `warehouse` string column on Product can stay exactly as is —
# we are not removing or renaming it, just adding a new FK column alongside it.
# This means nothing that currently reads Product.warehouse will break.
# ---------------------------------------------------------------------------