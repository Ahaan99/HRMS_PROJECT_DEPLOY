from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.db import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(Integer, ForeignKey("employees.id"))

    document_name = Column(String(255))
    file_path = Column(String(255))
    status = Column(String(50), default="Pending")