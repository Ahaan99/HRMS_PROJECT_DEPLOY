from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy import ForeignKey
from datetime import datetime

from app.database.db import Base


class InternationalVerification(Base):
    __tablename__ = "international_verification"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(Integer, ForeignKey("employees.id"))

    # ISO-style country code, e.g. NP, BT, BD, LK, PK, AF, MV
    country_code = Column(String(5))
    country_name = Column(String(80))

    # Document type key, e.g. citizenship, national_id, passport, cid, nid
    doc_type = Column(String(40))
    doc_label = Column(String(120))

    # Masked value only - never the full number
    doc_masked = Column(String(40))

    status = Column(String(50), default="Pending Approval")
    remarks = Column(String(500), default="")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
