import os

# Set test environment variables BEFORE any app modules are imported.
# Pydantic Settings gives env vars higher priority than .env file.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET"] = "test-secret-key-for-testing-only"
os.environ["USE_S3"] = "false"
os.environ["RESEND_API_KEY"] = ""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    """slowapi's Limiter keeps per-IP counters in process memory, so without
    resetting it, rapid-fire tests hitting the same endpoint (e.g. login,
    forgot-password) trip real rate limits and fail with 429s that have
    nothing to do with the test itself."""
    from app.main import limiter

    limiter.reset()
    yield


@pytest.fixture()
def engine():
    """Fresh in-memory SQLite per test — complete isolation."""
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(eng)
    return eng


@pytest.fixture()
def session(engine, monkeypatch):
    """Session wired to the test engine; patches app.db.engine so that
    any code path using it directly also hits the in-memory DB."""
    import app.db as db_module

    monkeypatch.setattr(db_module, "engine", engine)
    with Session(engine) as s:
        yield s


@pytest.fixture()
def client(session):
    """TestClient with overridden DB session and mocked storage.
    Not used as a context manager → lifespan (seeding) does NOT run."""
    from app.db import get_session
    from app.main import app

    def _override():
        yield session

    app.dependency_overrides[get_session] = _override

    with (
        patch("app.api.tryon.upload_image", return_value="images/test-key.png"),
        patch("app.api.tryon.get_presigned_url", return_value="http://test.example.com/image.png"),
        patch("app.api.garments.get_presigned_url", return_value="http://test.example.com/image.png"),
        patch("app.api.upload.upload_image", return_value="images/test-key.png"),
        patch("app.api.upload.get_presigned_url", return_value="http://test.example.com/image.png"),
        patch("app.storage.ensure_bucket"),
    ):
        yield TestClient(app)

    app.dependency_overrides.clear()


@pytest.fixture()
def registered_user(client):
    resp = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User",
    })
    assert resp.status_code == 200
    return resp.json()


@pytest.fixture()
def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['access_token']}"}
