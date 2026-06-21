from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base_class import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # IN | OUT | TRF
    sku = Column(String, nullable=False)
    product_name = Column(String)
    qty = Column(Integer, default=0)
    value = Column(Float, default=0)
    warehouse = Column(String)
    note = Column(String, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String, nullable=True)

    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
