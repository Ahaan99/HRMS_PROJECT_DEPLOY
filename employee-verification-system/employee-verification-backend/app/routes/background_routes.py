from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.schemas.background_schema import BackgroundVerificationCreate
from app.database.db import get_db
from app.models.background_verification import BackgroundVerification
from app.models.employee import Employee
from app.models.audit_log import AuditLog

router = APIRouter()


class StatusUpdate(BaseModel):
    action: str  # "start" | "verify" | "reject"
    remarks: str = ""


# =========================================================
# CREATE (starts as Pending - real tracking workflow)
# =========================================================
@router.post("/background-verification")
def create_background_verification(
    data: BackgroundVerificationCreate,
    db: Session = Depends(get_db),
):

    employee = db.query(Employee).filter(
        Employee.id == data.employee_id
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    verification = BackgroundVerification(
        employee_id=data.employee_id,
        previous_company=data.previous_company,
        hr_email=data.hr_email,
        feedback=data.feedback,
        rehire_eligible=data.rehire_eligible,
        criminal_record=data.criminal_record,
        status="Pending",
    )

    db.add(verification)
    db.commit()
    db.refresh(verification)

    log = AuditLog(
        document_id=0,
        action=f"Background verification opened for employee {data.employee_id}",
    )
    db.add(log)
    db.commit()

    return {
        "message": "Background verification created (Pending)",
        "id": verification.id,
    }


# =========================================================
# LIST (joined with employee name)
# =========================================================
@router.get("/background-verification")
def get_background_verifications(db: Session = Depends(get_db)):

    rows = (
        db.query(BackgroundVerification, Employee.name)
        .join(Employee, Employee.id == BackgroundVerification.employee_id)
        .all()
    )

    return [
        {
            "id": rec.id,
            "employee_id": rec.employee_id,
            "employee_name": name,
            "previous_company": rec.previous_company,
            "hr_email": rec.hr_email,
            "feedback": rec.feedback,
            "rehire_eligible": rec.rehire_eligible,
            "criminal_record": rec.criminal_record,
            "status": rec.status,
        }
        for rec, name in rows
    ]


# =========================================================
# STATUS TRACKING: Pending -> In Progress -> Verified/Rejected
# =========================================================
@router.put("/background-verification/{record_id}")
def update_background_status(
    record_id: int,
    data: StatusUpdate,
    db: Session = Depends(get_db),
):

    record = db.query(BackgroundVerification).filter(
        BackgroundVerification.id == record_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    status_map = {
        "start": "In Progress",
        "verify": "Verified",
        "reject": "Rejected",
    }

    if data.action not in status_map:
        raise HTTPException(status_code=400, detail="Invalid action")

    record.status = status_map[data.action]

    if data.remarks:
        record.feedback = data.remarks

    db.commit()

    log = AuditLog(
        document_id=0,
        action=f"Background verification {record.status} for employee {record.employee_id}",
    )
    db.add(log)
    db.commit()

    return {"message": f"Background verification {record.status}"}
