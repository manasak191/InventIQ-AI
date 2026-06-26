# Save as: backend/app/db/models/message.py

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base_class import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # sender

    category = Column(String, nullable=False, default="other")  # product | supplier | transaction | other
    reference = Column(String, nullable=True)  # free-text e.g. SKU, supplier name, PO number
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)

    status = Column(String, nullable=False, default="open")  # open | answered | closed

    admin_reply = Column(Text, nullable=True)
    replied_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    replied_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())