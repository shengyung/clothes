import hashlib
from datetime import datetime, timedelta, timezone

import resend
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from app.auth import (
    create_access_token,
    create_and_store_refresh_token,
    get_current_user,
    hash_password,
    revoke_refresh_token,
    verify_password,
    verify_refresh_token,
)
from app.config import settings
from app.db import get_session
from app.models import PasswordResetToken, User

router = APIRouter(tags=["auth"])


# ── Request / Response schemas ────────────────────────────────────────────────

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


class LogoutRequest(BaseModel):
    refresh_token: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    avatar_url: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None
    avatar_url: str | None
    is_admin: bool
    oauth_provider: str | None


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse


def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        is_admin=user.is_admin,
        oauth_provider=user.oauth_provider,
    )


def _auth_response(user: User, session: Session) -> AuthResponse:
    return AuthResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_and_store_refresh_token(user.id, session),
        user=_user_response(user),
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/auth/register", response_model=AuthResponse)
def register(body: RegisterRequest, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == body.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email 已被使用")
    if len(body.password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="密碼至少需要 8 個字元")
    user = User(
        email=body.email,
        name=body.name,
        password_hash=hash_password(body.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return _auth_response(user, session)


@router.post("/auth/login", response_model=AuthResponse)
def login(body: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == body.email)).first()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email 或密碼錯誤")
    return _auth_response(user, session)


@router.post("/auth/sso", response_model=AuthResponse)
def sso_login(body: SsoRequest, session: Session = Depends(get_session)):
    user = session.exec(
        select(User).where(
            User.oauth_provider == body.provider,
            User.oauth_provider_id == body.provider_id,
        )
    ).first()

    if not user:
        user = session.exec(select(User).where(User.email == body.email)).first()
        if user:
            user.oauth_provider = body.provider
            user.oauth_provider_id = body.provider_id
            if body.avatar_url and not user.avatar_url:
                user.avatar_url = body.avatar_url
            if body.name and not user.name:
                user.name = body.name
        else:
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

    return _auth_response(user, session)


@router.post("/auth/logout")
def logout(body: LogoutRequest, session: Session = Depends(get_session)):
    revoke_refresh_token(body.refresh_token, session)
    return {"message": "已登出"}


@router.post("/auth/refresh", response_model=AuthResponse)
def refresh(body: RefreshRequest, session: Session = Depends(get_session)):
    user = verify_refresh_token(body.refresh_token, session)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token 無效或已過期")
    # Token rotation：撤銷舊的，發新的
    revoke_refresh_token(body.refresh_token, session)
    return _auth_response(user, session)


@router.post("/auth/forgot-password")
def forgot_password(body: ForgotPasswordRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == body.email)).first()
    # 不論是否找到用戶，都回傳相同訊息（防止 email 枚舉攻擊）
    if user:
        import os
        raw = os.urandom(32).hex()
        token_hash = hashlib.sha256(raw.encode()).hexdigest()
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        session.add(reset_token)
        session.commit()

        if settings.resend_api_key:
            resend.api_key = settings.resend_api_key
            reset_url = f"{settings.frontend_url}/reset-password?token={raw}"
            resend.Emails.send({
                "from": "noreply@yourdomain.com",
                "to": user.email,
                "subject": "重設您的密碼",
                "html": f"""
                <p>您好，</p>
                <p>請點擊以下連結重設您的密碼（1小時內有效）：</p>
                <p><a href="{reset_url}">{reset_url}</a></p>
                <p>若您沒有要求重設密碼，請忽略此信件。</p>
                """,
            })

    return {"message": "若此 Email 存在，重設連結已寄出"}


@router.post("/auth/reset-password")
def reset_password(body: ResetPasswordRequest, session: Session = Depends(get_session)):
    if len(body.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="密碼至少需要 8 個字元")

    token_hash = hashlib.sha256(body.token.encode()).hexdigest()
    record = session.exec(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False,  # noqa: E712
        )
    ).first()

    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="重設連結無效或已使用")
    if record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="重設連結已過期")

    user = session.get(User, record.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用戶不存在")

    user.password_hash = hash_password(body.new_password)
    record.used = True
    session.add(user)
    session.add(record)
    session.commit()
    return {"message": "密碼已重設，請重新登入"}


@router.patch("/auth/profile", response_model=UserResponse)
def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if body.name is not None:
        current_user.name = body.name
    if body.avatar_url is not None:
        current_user.avatar_url = body.avatar_url
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return _user_response(current_user)


@router.post("/auth/change-password")
def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if not current_user.password_hash:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SSO 帳號無法使用此功能")
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="目前密碼錯誤")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="密碼至少需要 8 個字元")
    current_user.password_hash = hash_password(body.new_password)
    session.add(current_user)
    session.commit()
    return {"message": "密碼已更新"}


@router.get("/auth/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return _user_response(current_user)