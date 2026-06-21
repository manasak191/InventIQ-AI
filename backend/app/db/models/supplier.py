from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String)
    email = Column(String)
    phone = Column(String)
    rating = Column(Float, default=0)
    orders = Column(Integer, default=0)
    on_time_percent = Column(Float, default=0)
    total_value = Column(Float, default=0)
    status = Column(String, default="active")  # active | preferred | review

    products = relationship("Product", back_populates="supplier")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
