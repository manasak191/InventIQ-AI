from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, default="info")  # critical | warning | info
    icon = Column(String, nullable=True)
    message = Column(String, nullable=False)
    source = Column(String, default="System")
    read = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
