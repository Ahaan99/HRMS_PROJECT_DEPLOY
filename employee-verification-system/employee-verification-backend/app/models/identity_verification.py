from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy import ForeignKey
from datetime import datetime

from app.database.db import Base


class IdentityVerification(Base):
    __tablename__ = "identity_verification"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(Integer, ForeignKey("employees.id"))

    # Masked values are stored, never the full number
    aadhaar_masked = Column(String(20))
    pan_masked = Column(String(20))

    aadhaar_status = Column(String(50), default="Not Submitted")
    pan_status = Column(String(50), default="Not Submitted")

    remarks = Column(String(500), default="")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
