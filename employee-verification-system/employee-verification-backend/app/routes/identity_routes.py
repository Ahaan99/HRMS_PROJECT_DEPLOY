import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.identity_verification import IdentityVerification
from app.models.employee import Employee
from app.models.audit_log import AuditLog

router = APIRouter()

# =========================================================
# AADHAAR VALIDATION (Verhoeff checksum - official algorithm)
# =========================================================
_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]

_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]


def verhoeff_valid(number: str) -> bool:
    c = 0
    for i, digit in enumerate(reversed(number)):
        c = _D[c][_P[i % 8][int(digit)]]
    return c == 0


def validate_aadhaar(aadhaar: str):
    aadhaar = re.sub(r"\s|-", "", aadhaar or "")

    if not re.fullmatch(r"\d{12}", aadhaar):
        return None, "Aadhaar must be exactly 12 digits"

    if aadhaar[0] in ("0", "1"):
        return None, "Aadhaar cannot start with 0 or 1"

    if not verhoeff_valid(aadhaar):
        return None, "Invalid Aadhaar number (checksum failed)"

    return aadhaar, None


def validate_pan(pan: str):
    pan = (pan or "").strip().upper()

    if not re.fullmatch(r"[A-Z]{5}\d{4}[A-Z]", pan):
        return None, "PAN must match format AAAAA9999A"

    # 4th character: holder type (P=Individual, C=Company, etc.)
    if pan[3] not in "ABCFGHLJPTK":
        return None, "Invalid PAN holder-type character"

    return pan, None


def mask_aadhaar(aadhaar: str) -> str:
    return "XXXX-XXXX-" + aadhaar[-4:]


def mask_pan(pan: str) -> str:
    return pan[:2] + "XXX" + "XXXX" + pan[-1]


# =========================================================
# SCHEMAS
# =========================================================
class IdentitySubmit(BaseModel):
    employee_id: int
    aadhaar_number: str = ""
    pan_number: str = ""


class IdentityDecision(BaseModel):
    field: str  # "aadhaar" or "pan"
    action: str  # "approve" or "reject"
    remarks: str = ""


# =========================================================
# SUBMIT AADHAAR / PAN FOR VERIFICATION
# =========================================================
@router.post("/identity-verification")
def submit_identity(data: IdentitySubmit, db: Session = Depends(get_db)):

    employee = db.query(Employee).filter(
        Employee.id == data.employee_id
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if not data.aadhaar_number and not data.pan_number:
        raise HTTPException(
            status_code=400,
            detail="Provide an Aadhaar number, a PAN number, or both",
        )

    record = db.query(IdentityVerification).filter(
        IdentityVerification.employee_id == data.employee_id
    ).first()

    if not record:
        record = IdentityVerification(employee_id=data.employee_id)
        db.add(record)

    results = {}

    if data.aadhaar_number:
        aadhaar, err = validate_aadhaar(data.aadhaar_number)
        if err:
            raise HTTPException(status_code=400, detail=err)
        record.aadhaar_masked = mask_aadhaar(aadhaar)
        record.aadhaar_status = "Pending Approval"
        results["aadhaar"] = "Format valid - pending approval"

    if data.pan_number:
        pan, err = validate_pan(data.pan_number)
        if err:
            raise HTTPException(status_code=400, detail=err)
        record.pan_masked = mask_pan(pan)
        record.pan_status = "Pending Approval"
        results["pan"] = "Format valid - pending approval"

    db.commit()
    db.refresh(record)

    log = AuditLog(
        document_id=0,
        action=f"Identity submitted for employee {data.employee_id}",
    )
    db.add(log)
    db.commit()

    return {
        "message": "Identity details validated and submitted",
        "record_id": record.id,
        "results": results,
    }


# =========================================================
# LIST IDENTITY VERIFICATIONS (joined with employee name)
# =========================================================
@router.get("/identity-verification")
def list_identity(db: Session = Depends(get_db)):

    rows = (
        db.query(IdentityVerification, Employee.name)
        .join(Employee, Employee.id == IdentityVerification.employee_id)
        .all()
    )

    return [
        {
            "id": rec.id,
            "employee_id": rec.employee_id,
            "employee_name": name,
            "aadhaar_masked": rec.aadhaar_masked,
            "pan_masked": rec.pan_masked,
            "aadhaar_status": rec.aadhaar_status,
            "pan_status": rec.pan_status,
            "remarks": rec.remarks,
            "updated_at": str(rec.updated_at),
        }
        for rec, name in rows
    ]


# =========================================================
# APPROVE / REJECT AADHAAR OR PAN
# =========================================================
@router.put("/identity-verification/{record_id}")
def decide_identity(
    record_id: int,
    data: IdentityDecision,
    db: Session = Depends(get_db),
):

    record = db.query(IdentityVerification).filter(
        IdentityVerification.id == record_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if data.field not in ("aadhaar", "pan"):
        raise HTTPException(status_code=400, detail="Invalid field")

    if data.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Invalid action")

    new_status = "Verified" if data.action == "approve" else "Rejected"

    if data.field == "aadhaar":
        record.aadhaar_status = new_status
    else:
        record.pan_status = new_status

    if data.remarks:
        record.remarks = data.remarks

    db.commit()

    log = AuditLog(
        document_id=0,
        action=f"{data.field.upper()} {new_status} for employee {record.employee_id}",
    )
    db.add(log)
    db.commit()

    return {"message": f"{data.field.upper()} {new_status}"}
