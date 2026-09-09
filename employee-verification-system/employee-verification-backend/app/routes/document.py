from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
import shutil
import uuid
from datetime import datetime, timedelta

from fastapi_mail import FastMail, MessageSchema

from app.database.db import get_db
from app.models.document import Document
from app.models.employee import Employee
from app.models.verification_token import VerificationToken
from app.email_config import conf

from app.models.audit_log import AuditLog

router = APIRouter()

# =========================
# UPLOAD DOCUMENT
# =========================
@router.post("/upload-document")
def upload_document(
    employee_id: int = Form(...),
    document_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    file_location = f"uploads/{file.filename}"

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_document = Document(
        employee_id=employee_id,
        document_name=document_name,
        file_path=file_location,
        status="Pending"
    )

    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    log = AuditLog(
    document_id=new_document.id,
    action="Document Uploaded"
)

    db.add(log)
    db.commit()         

    

    return {
        "message": "Document Uploaded Successfully",
        "document_id": new_document.id
    }


# =========================
# GET DOCUMENTS
# =========================
@router.get("/documents")
def get_documents(db: Session = Depends(get_db)):
    return db.query(Document).all()


# =========================
# SECURE EMAIL SEND (TOKEN BASED)
# =========================
@router.post("/send-verification-email/{document_id}")
async def send_verification_email(
    document_id: int,
    email: str,
    db: Session = Depends(get_db)
):

    document = db.query(Document).filter(
        Document.id == document_id
    ).first()

    if not document:
        return {"message": "Document Not Found"}

    # =========================
    # TOKEN GENERATION
    # =========================
    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(minutes=30)

    db_token = VerificationToken(
        document_id=document_id,
        token=token,
        expires_at=expires_at,
        used=False
    )

    db.add(db_token)
    db.commit()

    # =========================
    # SECURE LINKS
    # =========================
    verify_link = f"http://localhost:5173/verify/{token}?action=verify"
    reject_link = f"http://localhost:5173/verify/{token}?action=reject"

    html = f"""
    <h2>Document Verification Request</h2>
    <p>Please verify this document.</p>

    <a href="{verify_link}">✅ Verify Document</a>
    <br><br>
    <a href="{reject_link}">❌ Reject Document</a>
    """

    message = MessageSchema(
        subject="Document Verification",
        recipients=[email],
        body=html,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)

    return {"message": "Verification Email Sent Successfully"}


# =========================
# SECURE VERIFY API
# =========================
@router.get("/verify-token/{token}")
def verify_token(
    token: str,
    action: str,
    db: Session = Depends(get_db)
):

    record = db.query(VerificationToken).filter(
        VerificationToken.token == token
    ).first()

    if not record:
        return {"message": "Invalid Token"}

    if record.used:
        return {"message": "Token Already Used"}

    if record.expires_at < datetime.utcnow():
        return {"message": "Token Expired"}

    document = db.query(Document).filter(
        Document.id == record.document_id
    ).first()

    if action == "reject":
        document.status = "Rejected"
    else:
        document.status = "Verified"

    record.used = True

    db.commit()
    log = AuditLog(
    document_id=record.document_id,
    action=document.status
)

    db.add(log)
    db.commit()


    return {"message": f"Document {document.status}"}


# =========================
# DASHBOARD
# =========================
@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):

    return {
        "total_employees": db.query(Employee).count(),
        "total_documents": db.query(Document).count(),
        "verified_documents": db.query(Document).filter(Document.status == "Verified").count(),
        "pending_documents": db.query(Document).filter(Document.status == "Pending").count(),
        "rejected_documents": db.query(Document).filter(Document.status == "Rejected").count(),
    }

# =========================
# AUDIT LOGS
# =========================

@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db)
):

    logs = db.query(AuditLog).all()

    return logs