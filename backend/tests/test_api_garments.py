"""Integration tests for /api/garments endpoints."""
import io

import pytest

from app.models import Garment

FAKE_IMAGE = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100  # minimal fake PNG bytes


@pytest.fixture()
def garment(session):
    g = Garment(name="Test Shirt", category="upper_body", image_url="images/shirt.png")
    session.add(g)
    session.commit()
    session.refresh(g)
    return g


class TestListGarments:
    def test_empty_list_when_no_garments(self, client):
        resp = client.get("/api/garments")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_all_garments(self, client, session):
        g1 = Garment(name="Shirt", category="upper_body", image_url="images/shirt.png")
        g2 = Garment(name="Jacket", category="upper_body", image_url="images/jacket.png")
        session.add(g1)
        session.add(g2)
        session.commit()

        resp = client.get("/api/garments")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_garment_has_required_fields(self, client, garment):
        resp = client.get("/api/garments")
        assert resp.status_code == 200
        item = resp.json()[0]
        assert "id" in item
        assert "name" in item
        assert "category" in item
        assert "image_url" in item

    def test_image_url_is_presigned(self, client, garment):
        resp = client.get("/api/garments")
        # Our mock returns a URL starting with http://
        assert resp.json()[0]["image_url"].startswith("http")


class TestGetGarment:
    def test_get_existing_garment(self, client, garment):
        resp = client.get(f"/api/garments/{garment.id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == garment.id
        assert data["name"] == "Test Shirt"
        assert data["category"] == "upper_body"

    def test_get_nonexistent_garment_returns_404(self, client):
        resp = client.get("/api/garments/nonexistent-id-xyz")
        assert resp.status_code == 404


class TestUploadGarment:
    def test_unauthenticated_returns_401(self, client):
        resp = client.post(
            "/api/garments/upload",
            files={"file": ("shirt.png", io.BytesIO(FAKE_IMAGE), "image/png")},
        )
        assert resp.status_code == 401

    def test_authenticated_succeeds(self, client, registered_user, auth_headers):
        resp = client.post(
            "/api/garments/upload",
            files={"file": ("shirt.png", io.BytesIO(FAKE_IMAGE), "image/png")},
            data={"name": "My Shirt"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "My Shirt"

    def test_rejects_disallowed_content_type(self, client, registered_user, auth_headers):
        resp = client.post(
            "/api/garments/upload",
            files={"file": ("shell.html", io.BytesIO(b"<script>alert(1)</script>"), "text/html")},
            headers=auth_headers,
        )
        assert resp.status_code == 400

    def test_rejects_oversized_file(self, client, registered_user, auth_headers):
        oversized = b"\x00" * (10 * 1024 * 1024 + 1)
        resp = client.post(
            "/api/garments/upload",
            files={"file": ("big.png", io.BytesIO(oversized), "image/png")},
            headers=auth_headers,
        )
        assert resp.status_code == 413
