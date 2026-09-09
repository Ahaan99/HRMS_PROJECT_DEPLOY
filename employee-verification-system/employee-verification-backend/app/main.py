from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI
from app.database.db import Base, engine

from app.models.user import User
from app.models.employee import Employee
from app.models.document import Document
from app.models.identity_verification import IdentityVerification
from app.models.international_verification import InternationalVerification
from app.models.employment_history import EmploymentHistory

from app.routes.employee import router as employee_router
from app.routes.auth import router as auth_router
from app.routes.document import router as document_router
from app.routes.background_routes import router as background_router
from app.routes.identity_routes import router as identity_router
from app.routes.international_routes import router as international_router
from app.routes.employment_history_routes import router as history_router
from app.routes.verification_dashboard import router as verification_dashboard_router
from app.routes.hrms_sync import router as hrms_sync_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employee_router)
app.include_router(auth_router)
app.include_router(document_router)
app.include_router(background_router)
app.include_router(identity_router)
app.include_router(international_router)
app.include_router(history_router)
app.include_router(verification_dashboard_router)
app.include_router(hrms_sync_router)


@app.get("/")
def home():
    return {"message": "Employee Verification Portal API Running"}
