from sqlalchemy import Column, Integer, String
from app.database.db import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100))
    phone = Column(String(20))
    department = Column(String(100))
    designation = Column(String(100))