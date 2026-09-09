import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.international_verification import InternationalVerification
from app.models.employee import Employee
from app.models.audit_log import AuditLog

router = APIRouter()

# =========================================================
# COUNTRY REGISTRY
# Each country defines its accepted citizenship/ID documents
# with official number formats, hints, and validation regex.
# =========================================================
COUNTRY_REGISTRY = {
    "NP": {
        "name": "Nepal",
        "documents": {
            "citizenship": {
                "label": "Citizenship Certificate (Nagarikta)",
                "hint": "District-issued number, digits with - or / (e.g. 12-01-75-01234)",
                "pattern": r"^[0-9]{1,6}([-/][0-9]{1,6}){0,3}$",
                "min_len": 5,
                "max_len": 20,
            },
            "national_id": {
                "label": "National Identity Card (NIN)",
                "hint": "10-digit National Identification Number",
                "pattern": r"^\d{10}$",
                "min_len": 10,
                "max_len": 10,
            },
            "passport": {
                "label": "Passport",
                "hint": "2 letters followed by 7 digits (e.g. PA1234567)",
                "pattern": r"^[A-Z]{2}\d{7}$",
                "min_len": 9,
                "max_len": 9,
            },
        },
    },
    "BT": {
        "name": "Bhutan",
        "documents": {
            "cid": {
                "label": "Citizenship Identity Card (CID)",
                "hint": "11-digit CID number",
                "pattern": r"^\d{11}$",
                "min_len": 11,
                "max_len": 11,
            },
            "passport": {
                "label": "Passport",
                "hint": "1 letter followed by 7 digits (e.g. A1234567)",
                "pattern": r"^[A-Z]\d{7}$",
                "min_len": 8,
                "max_len": 8,
            },
        },
    },
    "BD": {
        "name": "Bangladesh",
        "documents": {
            "nid": {
                "label": "National ID Card (NID)",
                "hint": "10, 13, or 17-digit NID number",
                "pattern": r"^(\d{10}|\d{13}|\d{17})$",
                "min_len": 10,
                "max_len": 17,
            },
            "birth_reg": {
                "label": "Birth Registration Certificate",
                "hint": "17-digit birth registration number",
                "pattern": r"^\d{17}$",
                "min_len": 17,
                "max_len": 17,
            },
            "passport": {
                "label": "Passport",
                "hint": "2 letters followed by 7 digits (e.g. BR1234567)",
                "pattern": r"^[A-Z]{2}\d{7}$",
                "min_len": 9,
                "max_len": 9,
            },
        },
    },
    "LK": {
        "name": "Sri Lanka",
        "documents": {
            "nic": {
                "label": "National Identity Card (NIC)",
                "hint": "Old: 9 digits + V/X (e.g. 851234567V) or New: 12 digits",
                "pattern": r"^(\d{9}[VvXx]|\d{12})$",
                "min_len": 10,
                "max_len": 12,
            },
            "passport": {
                "label": "Passport",
                "hint": "1 letter followed by 7 or 8 digits (e.g. N1234567)",
                "pattern": r"^[A-Z]\d{7,8}$",
                "min_len": 8,
                "max_len": 9,
            },
        },
    },
    "AF": {
        "name": "Afghanistan",
        "documents": {
            "tazkira": {
                "label": "Tazkira (National ID)",
                "hint": "Electronic Tazkira number, 10 to 14 digits",
                "pattern": r"^\d{10,14}$",
                "min_len": 10,
                "max_len": 14,
            },
            "passport": {
                "label": "Passport",
                "hint": "1-2 letters followed by 7 digits (e.g. P1234567)",
                "pattern": r"^[A-Z]{1,2}\d{7}$",
                "min_len": 8,
                "max_len": 9,
            },
        },
    },
    "MV": {
        "name": "Maldives",
        "documents": {
            "national_id": {
                "label": "National Identity Card",
                "hint": "Letter A followed by 6 digits (e.g. A123456)",
                "pattern": r"^A\d{6}$",
                "min_len": 7,
                "max_len": 7,
            },
            "passport": {
                "label": "Passport",
                "hint": "2 letters followed by 7 digits",
                "pattern": r"^[A-Z]{2}\d{7}$",
                "min_len": 9,
                "max_len": 9,
            },
        },
    },
    "OTHER": {
        "name": "Other Country",
        "documents": {
            "passport": {
                "label": "Passport (International)",
                "hint": "6 to 12 letters/digits as printed on the passport",
                "pattern": r"^[A-Z0-9]{6,12}$",
                "min_len": 6,
                "max_len": 12,
            },
        },
    },
}


def mask_doc(value: str) -> str:
    tail = value[-3:] if len(value) > 3 else value[-1:]
    return "X" * max(len(value) - len(tail), 4) + tail


def validate_doc(country_code: str, doc_type: str, number: str):
    country = COUNTRY_REGISTRY.get(country_code)
    if not country:
        return None, None, "Unsupported country"

    doc = country["documents"].get(doc_type)
    if not doc:
        return None, None, "Unsupported document type for this country"

    cleaned = (number or "").strip().upper()
    cleaned = re.sub(r"\s", "", cleaned)

    if not cleaned:
        return None, None, "Document number is required"

    if not re.fullmatch(doc["pattern"], cleaned):
        return None, None, (
            f"Invalid {doc['label']} format. Expected: {doc['hint']}"
        )

    return cleaned, doc, None


# =========================================================
# SCHEMAS
# =========================================================
class InternationalSubmit(BaseModel):
    employee_id: int
    country_code: str
    doc_type: str
    doc_number: str


class InternationalDecision(BaseModel):
    action: str  # "approve" or "reject"
    remarks: str = ""


# =========================================================
# COUNTRY REGISTRY (for the frontend to render dynamically)
# =========================================================
@router.get("/international-verification/countries")
def list_countries():
    return [
        {
            "code": code,
            "name": info["name"],
            "documents": [
                {
                    "type": dtype,
                    "label": d["label"],
                    "hint": d["hint"],
                    "max_len": d["max_len"],
                }
                for dtype, d in info["documents"].items()
            ],
        }
        for code, info in COUNTRY_REGISTRY.items()
    ]


# =========================================================
# SUBMIT INTERNATIONAL DOCUMENT FOR VERIFICATION
# =========================================================
@router.post("/international-verification")
def submit_international(
    data: InternationalSubmit, db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(
        Employee.id == data.employee_id
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    code = (data.country_code or "").strip().upper()

    cleaned, doc, err = validate_doc(code, data.doc_type, data.doc_number)
    if err:
        raise HTTPException(status_code=400, detail=err)

    country = COUNTRY_REGISTRY[code]

    record = db.query(InternationalVerification).filter(
        InternationalVerification.employee_id == data.employee_id,
        InternationalVerification.country_code == code,
        InternationalVerification.doc_type == data.doc_type,
    ).first()

    if not record:
        record = InternationalVerification(
            employee_id=data.employee_id,
            country_code=code,
            country_name=country["name"],
            doc_type=data.doc_type,
            doc_label=doc["label"],
        )
        db.add(record)

    record.doc_masked = mask_doc(cleaned)
    record.status = "Pending Approval"

    db.commit()
    db.refresh(record)

    try:
        log = AuditLog(
            document_id=0,
            action=(
                f"Intl {code} {data.doc_type} "
                f"submitted e{data.employee_id}"
            )[:100],
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()

    return {
        "message": (
            f"{country['name']} {doc['label']} validated - pending approval"
        ),
        "record_id": record.id,
    }


# =========================================================
# LIST INTERNATIONAL VERIFICATIONS
# =========================================================
@router.get("/international-verification")
def list_international(db: Session = Depends(get_db)):
    rows = (
        db.query(InternationalVerification, Employee.name)
        .join(
            Employee,
            Employee.id == InternationalVerification.employee_id,
        )
        .all()
    )

    return [
        {
            "id": rec.id,
            "employee_id": rec.employee_id,
            "employee_name": name,
            "country_code": rec.country_code,
            "country_name": rec.country_name,
            "doc_type": rec.doc_type,
            "doc_label": rec.doc_label,
            "doc_masked": rec.doc_masked,
            "status": rec.status,
            "remarks": rec.remarks,
            "updated_at": str(rec.updated_at),
        }
        for rec, name in rows
    ]


# =========================================================
# APPROVE / REJECT INTERNATIONAL DOCUMENT
# =========================================================
@router.put("/international-verification/{record_id}")
def decide_international(
    record_id: int,
    data: InternationalDecision,
    db: Session = Depends(get_db),
):
    record = db.query(InternationalVerification).filter(
        InternationalVerification.id == record_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if data.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Invalid action")

    record.status = "Verified" if data.action == "approve" else "Rejected"

    if data.remarks:
        record.remarks = data.remarks

    db.commit()

    try:
        log = AuditLog(
            document_id=0,
            action=(
                f"Intl {record.country_code} {record.doc_type} "
                f"{record.status} e{record.employee_id}"
            )[:100],
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()

    return {"message": f"{record.doc_label} {record.status}"}
