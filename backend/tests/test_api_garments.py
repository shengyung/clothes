"""Integration tests for /api/garments endpoints."""
import pytest

from app.models import Garment


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
