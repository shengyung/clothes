"""Integration tests for POST /api/upload."""
import io

FAKE_IMAGE = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100  # minimal fake PNG bytes


class TestUpload:
    def test_unauthenticated_returns_401(self, client):
        resp = client.post(
            "/api/upload",
            files={"file": ("photo.png", io.BytesIO(FAKE_IMAGE), "image/png")},
        )
        assert resp.status_code == 401

    def test_authenticated_succeeds(self, client, registered_user, auth_headers):
        resp = client.post(
            "/api/upload",
            files={"file": ("photo.png", io.BytesIO(FAKE_IMAGE), "image/png")},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert "key" in resp.json()

    def test_rejects_disallowed_content_type(self, client, registered_user, auth_headers):
        resp = client.post(
            "/api/upload",
            files={"file": ("shell.html", io.BytesIO(b"<script>alert(1)</script>"), "text/html")},
            headers=auth_headers,
        )
        assert resp.status_code == 400

    def test_rejects_oversized_file(self, client, registered_user, auth_headers):
        oversized = b"\x00" * (10 * 1024 * 1024 + 1)
        resp = client.post(
            "/api/upload",
            files={"file": ("big.png", io.BytesIO(oversized), "image/png")},
            headers=auth_headers,
        )
        assert resp.status_code == 413
