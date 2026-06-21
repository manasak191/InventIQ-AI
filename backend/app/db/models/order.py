from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base_class import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    supplier_name = Column(String, nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    sku = Column(String, nullable=True)
    qty = Column(Integer, default=0)
    total_value = Column(Float, default=0)
    status = Column(String, default="pending")  # pending | approved | rejected | delivered

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
