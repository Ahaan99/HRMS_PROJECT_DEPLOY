from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy import ForeignKey
from datetime import datetime

from app.database.db import Base


class EmploymentHistory(Base):
    __tablename__ = "employment_history"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(Integer, ForeignKey("employees.id"))

    company_name = Column(String(255))
    designation = Column(String(255))
    start_date = Column(String(20))
    end_date = Column(String(20))
    hr_contact_email = Column(String(255))

    # Pending -> In Progress -> Validated / Rejected
    status = Column(String(50), default="Pending")
    remarks = Column(String(500), default="")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
