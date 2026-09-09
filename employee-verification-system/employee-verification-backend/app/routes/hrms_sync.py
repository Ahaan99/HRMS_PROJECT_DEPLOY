"""
HRMS Integration.

Connects the Employee Verification System to the main HRMS
(hrms_db - the same database used by the admin, HR, IT, client
and employee portals via the Node backend on port 5000).

- GET  /hrms-status     -> connection health + employee counts
- POST /hrms-sync       -> pull employees from hrms_db into EVS
- GET  /reports-summary -> rich reporting data for the Reports page
"""

import os

import pymysql
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.employee import Employee
from app.models.document import Document
from app.models.identity_verification import IdentityVerification
from app.models.employment_history import EmploymentHistory
from app.models.background_verification import BackgroundVerification
from app.models.audit_log import AuditLog

router = APIRouter()

HRMS_DB = os.getenv("HRMS_DB_NAME", "hrms_db")


def hrms_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=HRMS_DB,
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=4,
    )


def fetch_hrms_employees():
    conn = hrms_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT e.id AS hrms_id,
                       e.employeeCode,
                       e.name,
                       e.email,
                       e.phone,
                       COALESCE(d.name, 'Others')   AS department,
                       COALESCE(g.name, 'Employee') AS designation,
                       e.isActive
                FROM employees e
                LEFT JOIN departments  d ON d.id = e.departmentId
                LEFT JOIN designations g ON g.id = e.designationId
                """
            )
            return cur.fetchall()
    finally:
        conn.close()


# =========================
# HRMS CONNECTION STATUS
# =========================
@router.get("/hrms-status")
def hrms_status(db: Session = Depends(get_db)):
    local_count = db.query(Employee).count()
    local_emails = {
        e[0] for e in db.query(Employee.email).all() if e[0]
    }

    try:
        rows = fetch_hrms_employees()
        hrms_emails = {r["email"] for r in rows if r["email"]}
        return {
            "connected": True,
            "hrms_database": HRMS_DB,
            "hrms_employees": len(rows),
            "local_employees": local_count,
            "synced": len(hrms_emails & local_emails),
            "not_synced": len(hrms_emails - local_emails),
        }
    except Exception as exc:
        return {
            "connected": False,
            "hrms_database": HRMS_DB,
            "error": str(exc)[:200],
            "local_employees": local_count,
        }


# =========================
# SYNC EMPLOYEES FROM HRMS
# =========================
@router.post("/hrms-sync")
def hrms_sync(db: Session = Depends(get_db)):
    try:
        rows = fetch_hrms_employees()
    except Exception as exc:
        return {"synced": 0, "error": f"HRMS DB not reachable: {exc}"[:200]}

    created, updated = 0, 0

    for row in rows:
        if not row["email"]:
            continue

        existing = (
            db.query(Employee)
            .filter(Employee.email == row["email"])
            .first()
        )

        if existing:
            existing.name = row["name"]
            existing.phone = row["phone"] or existing.phone
            existing.department = row["department"]
            existing.designation = row["designation"]
            updated += 1
        else:
            db.add(
                Employee(
                    name=row["name"],
                    email=row["email"],
                    phone=row["phone"] or "",
                    department=row["department"],
                    designation=row["designation"],
                )
            )
            created += 1

    db.add(
        AuditLog(
            document_id=0,
            action=f"HRMS Sync: {created} added, {updated} updated",
        )
    )
    db.commit()

    return {
        "synced": created + updated,
        "created": created,
        "updated": updated,
        "message": f"Synced from HRMS: {created} new, {updated} updated",
    }


# =========================
# HRMS ADMIN DOCUMENTS
# =========================
@router.get("/hrms-documents")
def hrms_documents():
    """Documents uploaded/verified in the HRMS admin portal
    (verification_documents table in hrms_db)."""
    try:
        conn = hrms_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT vd.id,
                           vd.employee_id AS hrms_employee_id,
                           vd.employee_name,
                           e.email,
                           vd.doc_type,
                           vd.status,
                           vd.remarks,
                           vd.verified_by,
                           vd.created_at
                    FROM verification_documents vd
                    LEFT JOIN employees e ON e.id = vd.employee_id
                    ORDER BY vd.id DESC
                    """
                )
                rows = cur.fetchall()
        finally:
            conn.close()

        for row in rows:
            if row.get("created_at"):
                row["created_at"] = str(row["created_at"])
        return {"connected": True, "documents": rows}
    except Exception as exc:
        return {"connected": False, "documents": [], "error": str(exc)[:200]}


# =========================
# REPORTS SUMMARY
# =========================
@router.get("/reports-summary")
def reports_summary(db: Session = Depends(get_db)):
    employees = db.query(Employee).all()

    # ---- per verification type ----
    def doc_count(status):
        return db.query(Document).filter(Document.status == status).count()

    identity = db.query(IdentityVerification).all()
    history = db.query(EmploymentHistory).all()
    background = db.query(BackgroundVerification).all()

    def tally(items, attr):
        out = {"Verified": 0, "Pending": 0, "Rejected": 0}
        for item in items:
            val = getattr(item, attr, None) or "Pending"
            if val in ("Validated", "Approved"):
                val = "Verified"
            if val in ("In Progress", "Submitted"):
                val = "Pending"
            out[val if val in out else "Pending"] += 1
        return out

    by_type = {
        "documents": {
            "Verified": doc_count("Verified"),
            "Pending": doc_count("Pending"),
            "Rejected": doc_count("Rejected"),
        },
        "aadhaar": tally(identity, "aadhaar_status"),
        "pan": tally(identity, "pan_status"),
        "background": tally(background, "status"),
        "employment_history": tally(history, "status"),
    }

    # ---- per department coverage ----
    id_by_emp = {r.employee_id: r for r in identity}
    bg_by_emp = {}
    for b in background:
        bg_by_emp.setdefault(b.employee_id, []).append(b)

    departments = {}
    for emp in employees:
        dept = emp.department or "Others"
        d = departments.setdefault(
            dept,
            {"department": dept, "employees": 0, "identity_done": 0,
             "background_done": 0},
        )
        d["employees"] += 1

        rec = id_by_emp.get(emp.id)
        if rec and rec.aadhaar_status == "Verified" and rec.pan_status == "Verified":
            d["identity_done"] += 1

        if any(b.status == "Verified" for b in bg_by_emp.get(emp.id, [])):
            d["background_done"] += 1

    return {
        "total_employees": len(employees),
        "by_type": by_type,
        "by_department": sorted(
            departments.values(), key=lambda d: -d["employees"]
        ),
    }
