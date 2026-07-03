"""Unit tests for app/auth.py — pure functions, no DB or HTTP."""
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.auth import (
    _hash_token,
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.config import settings


class TestPasswordHashing:
    def test_hash_returns_bcrypt_prefix(self):
        assert hash_password("mypassword").startswith("$2b$")

    def test_hash_is_not_plaintext(self):
        assert hash_password("mypassword") != "mypassword"

    def test_different_calls_produce_different_hashes(self):
        # bcrypt uses a random salt each time
        assert hash_password("same") != hash_password("same")

    def test_verify_correct_password(self):
        hashed = hash_password("correct")
        assert verify_password("correct", hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("correct")
        assert verify_password("wrong", hashed) is False

    def test_verify_empty_password_fails(self):
        hashed = hash_password("password")
        assert verify_password("", hashed) is False


class TestAccessToken:
    def test_create_and_decode_roundtrip(self):
        token = create_access_token("user-abc-123")
        assert decode_token(token) == "user-abc-123"

    def test_decode_garbage_returns_none(self):
        assert decode_token("not.a.valid.token") is None

    def test_decode_empty_string_returns_none(self):
        assert decode_token("") is None

    def test_decode_expired_token_returns_none(self):
        expired_payload = {
            "sub": "user123",
            "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        }
        expired = jwt.encode(expired_payload, settings.jwt_secret, algorithm="HS256")
        assert decode_token(expired) is None

    def test_decode_wrong_secret_returns_none(self):
        token = jwt.encode({"sub": "uid"}, "wrong-secret", algorithm="HS256")
        assert decode_token(token) is None

    def test_token_carries_correct_user_id(self):
        for uid in ["abc", "123", "some-uuid-value"]:
            assert decode_token(create_access_token(uid)) == uid


class TestHashToken:
    def test_hash_is_deterministic(self):
        assert _hash_token("abc123") == _hash_token("abc123")

    def test_different_inputs_give_different_hashes(self):
        assert _hash_token("abc") != _hash_token("def")

    def test_hash_length_is_sha256_hex(self):
        assert len(_hash_token("test")) == 64  # SHA-256 → 32 bytes → 64 hex chars
