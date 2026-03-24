from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.db import get_session
from app.models import User

router = APIRouter(tags=["auth"])


# ── Request / Response schemas ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SsoRequest(BaseModel):
    provider: str          # "google" | "line" | "facebook" | "apple"
    provider_id: str
    email: EmailStr
    name: str | None = None
    avatar_url: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None
    avatar_url: str | None
    is_admin: bool


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        is_admin=user.is_admin,
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/auth/register", response_model=AuthResponse)
def register(body: RegisterRequest, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == body.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email 已被使用")
    user = User(
        email=body.email,
        name=body.name,
        password_hash=hash_password(body.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return AuthResponse(token=create_access_token(user.id), user=_user_response(user))


@router.post("/auth/login", response_model=AuthResponse)
def login(body: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == body.email)).first()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email 或密碼錯誤")
    return AuthResponse(token=create_access_token(user.id), user=_user_response(user))


@router.post("/auth/sso", response_model=AuthResponse)
def sso_login(body: SsoRequest, session: Session = Depends(get_session)):
    # 1. 先找 provider + provider_id 相符的用戶
    user = session.exec(
        select(User).where(
            User.oauth_provider == body.provider,
            User.oauth_provider_id == body.provider_id,
        )
    ).first()

    if not user:
        # 2. 嘗試用 email 找（同一個人可能之前用 email 註冊過）
        user = session.exec(select(User).where(User.email == body.email)).first()
        if user:
            # 綁定 SSO provider 到現有帳號
            user.oauth_provider = body.provider
            user.oauth_provider_id = body.provider_id
            if body.avatar_url and not user.avatar_url:
                user.avatar_url = body.avatar_url
            if body.name and not user.name:
                user.name = body.name
        else:
            # 3. 建立新用戶
            user = User(
                email=body.email,
                name=body.name,
                avatar_url=body.avatar_url,
                oauth_provider=body.provider,
                oauth_provider_id=body.provider_id,
            )
        session.add(user)
        session.commit()
        session.refresh(user)

    return AuthResponse(token=create_access_token(user.id), user=_user_response(user))


@router.get("/auth/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return _user_response(current_user)
