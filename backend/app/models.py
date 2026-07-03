import uuid
from datetime import date, datetime, timezone

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str | None = None
    avatar_url: str | None = None
    password_hash: str | None = None       # email 登入用，SSO 用戶為 None
    oauth_provider: str | None = None      # "google" | "line" | "facebook" | "apple"
    oauth_provider_id: str | None = None   # provider 給的唯一 ID
    is_admin: bool = Field(default=False)
    daily_credits_used: int = Field(default=0)
    credits_reset_date: date | None = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Garment(SQLModel, table=True):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    name: str
    category: str = "tops"
    image_url: str


class TryonTask(SQLModel, table=True):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    person_image_url: str
    garment_id: str = Field(foreign_key="garment.id")
    user_id: str | None = Field(default=None, foreign_key="user.id", index=True)
    status: str = "pending"  # pending | processing | completed | failed
    result_image_url: str | None = None
    error: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RefreshToken(SQLModel, table=True):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    token_hash: str              # SHA-256 of raw token
    expires_at: datetime
    revoked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PasswordResetToken(SQLModel, table=True):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    token_hash: str              # SHA-256 of raw token，一次性使用
    expires_at: datetime         # 1 小時後過期
    used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
