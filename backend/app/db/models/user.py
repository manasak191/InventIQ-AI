from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    first_name = Column(String)
    last_name = Column(String)

    email = Column(String, unique=True, index=True)

    phone = Column(String)

    password_hash = Column(String)

    role = Column(String)

    email_verified = Column(Boolean, default=False)

    otp_code = Column(String)

    company_name = Column(String)

    terms_accepted = Column(Boolean, default=False)

    is_active = Column(Boolean, default=True)
    
    reset_token = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
