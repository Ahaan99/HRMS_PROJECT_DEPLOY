from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.db import Base

class BackgroundVerification(Base):

    __tablename__ = "background_verification"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(Integer, ForeignKey("employees.id"))

    previous_company = Column(String(255))

    hr_email = Column(String(255))

    feedback = Column(String(500))

    rehire_eligible = Column(String(50))

    criminal_record = Column(String(50))
    
    status = Column(String(50), default="Pending")