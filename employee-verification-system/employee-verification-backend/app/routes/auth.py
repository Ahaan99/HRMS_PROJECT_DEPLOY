from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.schemas.user_schema import UserCreate, UserLogin
from app.database.db import get_db
from app.models.user import User

from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException

from fastapi.security import OAuth2PasswordRequestForm

import os as _os

SECRET_KEY = _os.getenv("EVS_JWT_SECRET", "mysecretkey")
if not _os.getenv("EVS_JWT_SECRET"):
    print(
        "[EVS] WARNING: EVS_JWT_SECRET env var is not set - using an insecure "
        "dev default for JWT signing. Set EVS_JWT_SECRET in production."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    try:
        print("STEP 1")

        existing_user = db.query(User).filter(User.email == user.email).first()
        print("STEP 2")

        hashed_password = pwd_context.hash(user.password)
        print("STEP 3")

        new_user = User(
            name=user.name,
            email=user.email,
            password=hashed_password,
            role=user.role
        )

        db.add(new_user)
        print("STEP 4")

        db.commit()
        print("STEP 5")

        db.refresh(new_user)

        return {
            "message": "User Registered Successfully",
            "user_id": new_user.id
        }

    except Exception as e:
        print("ERROR:", e)
        return {"error": str(e)}

    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        return {"message": "Email already registered"}

    hashed_password = pwd_context.hash(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User Registered Successfully",
        "user_id": new_user.id
    }

import os
import secrets

from pydantic import BaseModel


HRMS_SSO_KEY = os.getenv("HRMS_SSO_KEY", "hrms-evs-sso-2026")

if not os.getenv("HRMS_SSO_KEY"):
    print(
        "[EVS] WARNING: HRMS_SSO_KEY env var is not set - using the dev default. "
        "It must match the HRMS Node backend's EVS_SSO_KEY, otherwise every "
        "SSO login from the admin panel will be rejected with 401."
    )

import hashlib
import hmac as hmac_lib
import time

# How long an SSO link stays valid (seconds). Short window so a URL
# leaked via browser history / server logs / Referer cannot be replayed.
SSO_MAX_AGE_SECONDS = 120


class SsoLoginRequest(BaseModel):
    email: str
    ts: str
    sig: str
    name: str | None = None


@router.post("/sso-login")
def sso_login(payload: SsoLoginRequest, db: Session = Depends(get_db)):
    """
    Trusted SSO handoff from the HRMS Admin Panel.

    The admin panel no longer sends the raw shared key. Instead it sends
    a short-lived signature: sig = HMAC-SHA256(HRMS_SSO_KEY, "email.ts").
    We recompute the signature and reject expired or tampered links.
    """
    if not payload.email or not payload.ts or not payload.sig:
        raise HTTPException(status_code=400, detail="Invalid SSO request")

    try:
        ts = int(payload.ts)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid SSO token")

    if abs(time.time() - ts) > SSO_MAX_AGE_SECONDS:
        raise HTTPException(
            status_code=401,
            detail="SSO link expired - open the portal from the HRMS admin panel again",
        )

    expected = hmac_lib.new(
        HRMS_SSO_KEY.encode(),
        f"{payload.email}.{payload.ts}".encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac_lib.compare_digest(expected, payload.sig):
        raise HTTPException(status_code=401, detail="Invalid SSO signature")

    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        # Auto-provision the super admin on first SSO handoff.
        # Random password: this account is only ever used via SSO.
        user = User(
            name=payload.name or "Super Admin",
            email=payload.email,
            password=pwd_context.hash(secrets.token_hex(16)),
            role="Admin",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role or "Admin",
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "name": user.name,
        "role": user.role or "Admin",
    }


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not pwd_context.verify(
        form_data.password,
        existing_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )

    access_token = create_access_token(
        data={
            "sub": existing_user.email,
            "role": existing_user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "name": existing_user.name,
        "role": existing_user.role or "User"
    }

@router.get("/profile")
def profile(token: str = Depends(oauth2_scheme)):

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        email = payload.get("sub")

        return {
            "message": "Protected route accessed",
            "email": email
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/me")
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        user = db.query(User).filter(User.email == email).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )