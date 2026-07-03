"""Integration tests for /api/auth/* endpoints."""
import hashlib
from datetime import datetime, timedelta, timezone

import pytest


class TestRegister:
    def test_success_returns_tokens_and_user(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "new@example.com",
            "password": "password123",
            "name": "New User",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == "new@example.com"
        assert data["user"]["name"] == "New User"

    def test_duplicate_email_returns_409(self, client):
        payload = {"email": "dup@example.com", "password": "password123"}
        client.post("/api/auth/register", json=payload)
        resp = client.post("/api/auth/register", json=payload)
        assert resp.status_code == 409

    def test_password_too_short_returns_422(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "user@example.com",
            "password": "1234567",  # 7 chars, minimum is 8
        })
        assert resp.status_code == 422

    def test_invalid_email_returns_422(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "not-an-email",
            "password": "password123",
        })
        assert resp.status_code == 422

    def test_register_without_name_sets_null(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "noname@example.com",
            "password": "password123",
        })
        assert resp.status_code == 200
        assert resp.json()["user"]["name"] is None


class TestLogin:
    def test_success_returns_tokens(self, client, registered_user):
        resp = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123",
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()
        assert "refresh_token" in resp.json()

    def test_wrong_password_returns_401(self, client, registered_user):
        resp = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpassword",
        })
        assert resp.status_code == 401

    def test_nonexistent_email_returns_401(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "ghost@example.com",
            "password": "password123",
        })
        assert resp.status_code == 401

    def test_invalid_email_format_returns_422(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "notanemail",
            "password": "password123",
        })
        assert resp.status_code == 422


class TestSSO:
    def test_new_sso_user_is_created(self, client):
        resp = client.post("/api/auth/sso", json={
            "provider": "google",
            "provider_id": "google-uid-1",
            "email": "sso@example.com",
            "name": "SSO User",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["user"]["email"] == "sso@example.com"
        assert data["user"]["oauth_provider"] == "google"

    def test_repeated_sso_returns_same_user_id(self, client):
        payload = {
            "provider": "google",
            "provider_id": "google-uid-2",
            "email": "sso2@example.com",
        }
        id1 = client.post("/api/auth/sso", json=payload).json()["user"]["id"]
        id2 = client.post("/api/auth/sso", json=payload).json()["user"]["id"]
        assert id1 == id2

    def test_sso_merges_existing_email_account(self, client):
        reg_id = client.post("/api/auth/register", json={
            "email": "merge@example.com",
            "password": "password123",
        }).json()["user"]["id"]

        sso = client.post("/api/auth/sso", json={
            "provider": "google",
            "provider_id": "google-uid-merge",
            "email": "merge@example.com",
        })
        assert sso.status_code == 200
        assert sso.json()["user"]["id"] == reg_id
        assert sso.json()["user"]["oauth_provider"] == "google"


class TestLogout:
    def test_logout_succeeds(self, client, registered_user):
        resp = client.post("/api/auth/logout", json={
            "refresh_token": registered_user["refresh_token"],
        })
        assert resp.status_code == 200

    def test_logout_revokes_refresh_token(self, client, registered_user):
        rt = registered_user["refresh_token"]
        client.post("/api/auth/logout", json={"refresh_token": rt})
        # Revoked token cannot refresh
        resp = client.post("/api/auth/refresh", json={"refresh_token": rt})
        assert resp.status_code == 401


class TestRefresh:
    def test_refresh_returns_new_tokens(self, client, registered_user):
        resp = client.post("/api/auth/refresh", json={
            "refresh_token": registered_user["refresh_token"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_token_rotation_invalidates_old_token(self, client, registered_user):
        old_rt = registered_user["refresh_token"]
        new_data = client.post("/api/auth/refresh", json={"refresh_token": old_rt}).json()
        # Old token must not work
        resp = client.post("/api/auth/refresh", json={"refresh_token": old_rt})
        assert resp.status_code == 401
        # New token must work
        resp2 = client.post("/api/auth/refresh", json={"refresh_token": new_data["refresh_token"]})
        assert resp2.status_code == 200

    def test_invalid_token_returns_401(self, client):
        resp = client.post("/api/auth/refresh", json={"refresh_token": "fake-token"})
        assert resp.status_code == 401


class TestMe:
    def test_returns_current_user(self, client, registered_user, auth_headers):
        resp = client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "test@example.com"
        assert "id" in data

    def test_without_token_returns_401(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_invalid_token_returns_401(self, client):
        resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid"})
        assert resp.status_code == 401


class TestUpdateProfile:
    def test_update_name_succeeds(self, client, auth_headers):
        resp = client.patch("/api/auth/profile", json={"name": "Updated Name"}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Name"

    def test_update_avatar_url(self, client, auth_headers):
        resp = client.patch("/api/auth/profile", json={"avatar_url": "https://example.com/avatar.png"}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["avatar_url"] == "https://example.com/avatar.png"

    def test_without_auth_returns_401(self, client):
        resp = client.patch("/api/auth/profile", json={"name": "X"})
        assert resp.status_code == 401


class TestChangePassword:
    def test_success(self, client, registered_user, auth_headers):
        resp = client.post("/api/auth/change-password", json={
            "current_password": "password123",
            "new_password": "newpassword456",
        }, headers=auth_headers)
        assert resp.status_code == 200

    def test_wrong_current_password_returns_401(self, client, registered_user, auth_headers):
        resp = client.post("/api/auth/change-password", json={
            "current_password": "wrongpassword",
            "new_password": "newpassword456",
        }, headers=auth_headers)
        assert resp.status_code == 401

    def test_new_password_too_short_returns_422(self, client, registered_user, auth_headers):
        resp = client.post("/api/auth/change-password", json={
            "current_password": "password123",
            "new_password": "short",
        }, headers=auth_headers)
        assert resp.status_code == 422

    def test_without_auth_returns_401(self, client):
        resp = client.post("/api/auth/change-password", json={
            "current_password": "old",
            "new_password": "newpassword456",
        })
        assert resp.status_code == 401

    def test_can_login_with_new_password_after_change(self, client, registered_user, auth_headers):
        client.post("/api/auth/change-password", json={
            "current_password": "password123",
            "new_password": "newpassword456",
        }, headers=auth_headers)
        resp = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "newpassword456",
        })
        assert resp.status_code == 200


class TestForgotPassword:
    def test_existing_email_returns_200(self, client, registered_user):
        resp = client.post("/api/auth/forgot-password", json={"email": "test@example.com"})
        assert resp.status_code == 200
        assert "message" in resp.json()

    def test_nonexistent_email_returns_same_200(self, client):
        # Security: prevent email enumeration
        resp = client.post("/api/auth/forgot-password", json={"email": "ghost@example.com"})
        assert resp.status_code == 200

    def test_invalid_email_returns_422(self, client):
        resp = client.post("/api/auth/forgot-password", json={"email": "not-email"})
        assert resp.status_code == 422


class TestResetPassword:
    def test_invalid_token_returns_400(self, client):
        resp = client.post("/api/auth/reset-password", json={
            "token": "invalid-token",
            "new_password": "newpassword123",
        })
        assert resp.status_code == 400

    def test_new_password_too_short_returns_422(self, client):
        resp = client.post("/api/auth/reset-password", json={
            "token": "any-token",
            "new_password": "short",
        })
        assert resp.status_code == 422

    def test_valid_token_resets_password(self, client, session, registered_user):
        from app.models import PasswordResetToken

        user_id = registered_user["user"]["id"]
        raw = "valid-reset-token-xyz"
        token_hash = hashlib.sha256(raw.encode()).hexdigest()
        reset = PasswordResetToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        session.add(reset)
        session.commit()

        resp = client.post("/api/auth/reset-password", json={
            "token": raw,
            "new_password": "brandnewpassword",
        })
        assert resp.status_code == 200

    def test_expired_token_returns_400(self, client, session, registered_user):
        from app.models import PasswordResetToken

        raw = "expired-reset-token"
        token_hash = hashlib.sha256(raw.encode()).hexdigest()
        reset = PasswordResetToken(
            user_id=registered_user["user"]["id"],
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
        )
        session.add(reset)
        session.commit()

        resp = client.post("/api/auth/reset-password", json={
            "token": raw,
            "new_password": "brandnewpassword",
        })
        assert resp.status_code == 400

    def test_used_token_returns_400(self, client, session, registered_user):
        from app.models import PasswordResetToken

        raw = "used-reset-token"
        token_hash = hashlib.sha256(raw.encode()).hexdigest()
        reset = PasswordResetToken(
            user_id=registered_user["user"]["id"],
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            used=True,
        )
        session.add(reset)
        session.commit()

        resp = client.post("/api/auth/reset-password", json={
            "token": raw,
            "new_password": "brandnewpassword",
        })
        assert resp.status_code == 400
