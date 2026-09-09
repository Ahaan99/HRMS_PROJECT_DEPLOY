import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.employment_history import EmploymentHistory
from app.models.employee import Employee
from app.models.audit_log import AuditLog

router = APIRouter()


class HistoryCreate(BaseModel):
    employee_id: int
    company_name: str
    designation: str
    start_date: str
    end_date: str
    hr_contact_email: str = ""


class HistoryDecision(BaseModel):
    action: str  # "validate" | "reject" | "in_progress"
    remarks: str = ""


DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


# =========================================================
# ADD EMPLOYMENT HISTORY ENTRY
# =========================================================
@router.post("/employment-history")
def add_history(data: HistoryCreate, db: Session = Depends(get_db)):

    employee = db.query(Employee).filter(
        Employee.id == data.employee_id
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if not data.company_name.strip():
        raise HTTPException(status_code=400, detail="Company name required")

    if not DATE_RE.match(data.start_date) or not DATE_RE.match(data.end_date):
        raise HTTPException(
            status_code=400, detail="Dates must be YYYY-MM-DD"
        )

    if data.end_date < data.start_date:
        raise HTTPException(
            status_code=400, detail="End date cannot be before start date"
        )

    record = EmploymentHistory(
        employee_id=data.employee_id,
        company_name=data.company_name.strip(),
        designation=data.designation.strip(),
        start_date=data.start_date,
        end_date=data.end_date,
        hr_contact_email=data.hr_contact_email.strip(),
        status="Pending",
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    log = AuditLog(
        document_id=0,
        action=f"Employment history added for employee {data.employee_id}",
    )
    db.add(log)
    db.commit()

    return {"message": "Employment history saved", "id": record.id}


# =========================================================
# LIST EMPLOYMENT HISTORY (joined with employee name)
# =========================================================
@router.get("/employment-history")
def list_history(db: Session = Depends(get_db)):

    rows = (
        db.query(EmploymentHistory, Employee.name)
        .join(Employee, Employee.id == EmploymentHistory.employee_id)
        .all()
    )

    return [
        {
            "id": rec.id,
            "employee_id": rec.employee_id,
            "employee_name": name,
            "company_name": rec.company_name,
            "designation": rec.designation,
            "start_date": rec.start_date,
            "end_date": rec.end_date,
            "hr_contact_email": rec.hr_contact_email,
            "status": rec.status,
            "remarks": rec.remarks,
        }
        for rec, name in rows
    ]


# =========================================================
# VALIDATE / REJECT / MARK IN PROGRESS
# =========================================================
@router.put("/employment-history/{record_id}")
def decide_history(
    record_id: int,
    data: HistoryDecision,
    db: Session = Depends(get_db),
):

    record = db.query(EmploymentHistory).filter(
        EmploymentHistory.id == record_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    status_map = {
        "validate": "Validated",
        "reject": "Rejected",
        "in_progress": "In Progress",
    }

    if data.action not in status_map:
        raise HTTPException(status_code=400, detail="Invalid action")

    record.status = status_map[data.action]

    if data.remarks:
        record.remarks = data.remarks

    db.commit()

    log = AuditLog(
        document_id=0,
        action=f"Employment history {record.status} for employee {record.employee_id}",
    )
    db.add(log)
    db.commit()

    return {"message": f"Employment history {record.status}"}
