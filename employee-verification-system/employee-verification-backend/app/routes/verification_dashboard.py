from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.employee import Employee
from app.models.document import Document
from app.models.identity_verification import IdentityVerification
from app.models.background_verification import BackgroundVerification
from app.models.employment_history import EmploymentHistory

router = APIRouter()


def overall(statuses):
    """Roll individual track statuses into one overall label."""
    meaningful = [s for s in statuses if s and s != "Not Submitted"]

    if not meaningful:
        return "Not Started"
    if any(s == "Rejected" for s in meaningful):
        return "Action Required"
    if all(s in ("Verified", "Validated") for s in meaningful):
        return "Fully Verified"
    return "In Progress"


@router.get("/verification-status")
def verification_status(db: Session = Depends(get_db)):

    employees = db.query(Employee).all()

    result = []

    for emp in employees:

        docs = db.query(Document).filter(
            Document.employee_id == emp.id
        ).all()

        if not docs:
            doc_status = "Not Submitted"
        elif any(d.status == "Rejected" for d in docs):
            doc_status = "Rejected"
        elif all(d.status == "Verified" for d in docs):
            doc_status = "Verified"
        else:
            doc_status = "Pending"

        identity = db.query(IdentityVerification).filter(
            IdentityVerification.employee_id == emp.id
        ).first()

        aadhaar_status = identity.aadhaar_status if identity else "Not Submitted"
        pan_status = identity.pan_status if identity else "Not Submitted"

        bg = db.query(BackgroundVerification).filter(
            BackgroundVerification.employee_id == emp.id
        ).order_by(BackgroundVerification.id.desc()).first()

        bg_status = bg.status if bg else "Not Submitted"

        histories = db.query(EmploymentHistory).filter(
            EmploymentHistory.employee_id == emp.id
        ).all()

        if not histories:
            history_status = "Not Submitted"
        elif any(h.status == "Rejected" for h in histories):
            history_status = "Rejected"
        elif all(h.status == "Validated" for h in histories):
            history_status = "Validated"
        else:
            history_status = "Pending"

        result.append({
            "employee_id": emp.id,
            "employee_name": emp.name,
            "department": emp.department,
            "documents": doc_status,
            "aadhaar": aadhaar_status,
            "pan": pan_status,
            "background": bg_status,
            "employment_history": history_status,
            "overall": overall([
                doc_status,
                aadhaar_status,
                pan_status,
                bg_status,
                history_status,
            ]),
        })

    summary = {
        "total": len(result),
        "fully_verified": sum(1 for r in result if r["overall"] == "Fully Verified"),
        "in_progress": sum(1 for r in result if r["overall"] == "In Progress"),
        "action_required": sum(1 for r in result if r["overall"] == "Action Required"),
        "not_started": sum(1 for r in result if r["overall"] == "Not Started"),
    }

    return {"summary": summary, "employees": result}
