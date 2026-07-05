"""Integration tests for /api/tryon endpoints."""
import io
from unittest.mock import patch

import pytest

from app.models import Garment, TryonTask


@pytest.fixture()
def garment(session):
    g = Garment(name="Test Shirt", category="upper_body", image_url="images/shirt.png")
    session.add(g)
    session.commit()
    session.refresh(g)
    return g


FAKE_IMAGE = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100  # minimal fake PNG bytes


class TestCreateTryon:
    def test_create_unauthenticated_returns_401(self, client, garment):
        # /api/tryon requires login so daily credit limits can be enforced per account.
        with patch("app.api.tryon.run_tryon"):
            resp = client.post(
                "/api/tryon",
                data={"garment_id": garment.id},
                files={"person_image": ("photo.jpg", io.BytesIO(FAKE_IMAGE), "image/jpeg")},
            )
        assert resp.status_code == 401

    def test_create_authenticated_links_user(self, client, garment, registered_user, auth_headers):
        with patch("app.api.tryon.run_tryon"):
            resp = client.post(
                "/api/tryon",
                data={"garment_id": garment.id},
                files={"person_image": ("photo.jpg", io.BytesIO(FAKE_IMAGE), "image/jpeg")},
                headers=auth_headers,
            )
        assert resp.status_code == 200

    def test_nonexistent_garment_returns_404(self, client, registered_user, auth_headers):
        resp = client.post(
            "/api/tryon",
            data={"garment_id": "nonexistent-garment"},
            files={"person_image": ("photo.jpg", io.BytesIO(FAKE_IMAGE), "image/jpeg")},
            headers=auth_headers,
        )
        assert resp.status_code == 404

    def test_missing_person_image_returns_422(self, client, garment, registered_user, auth_headers):
        resp = client.post("/api/tryon", data={"garment_id": garment.id}, headers=auth_headers)
        assert resp.status_code == 422

    def test_missing_garment_id_returns_422(self, client, registered_user, auth_headers):
        resp = client.post(
            "/api/tryon",
            files={"person_image": ("photo.jpg", io.BytesIO(FAKE_IMAGE), "image/jpeg")},
            headers=auth_headers,
        )
        assert resp.status_code == 422


class TestGetTryonStatus:
    def test_pending_task(self, client, session, garment):
        task = TryonTask(
            person_image_url="images/person.png",
            garment_id=garment.id,
            status="pending",
        )
        session.add(task)
        session.commit()
        session.refresh(task)

        resp = client.get(f"/api/tryon/{task.id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["task_id"] == task.id
        assert data["status"] == "pending"
        assert "result_image_url" not in data

    def test_completed_task_includes_image_urls(self, client, session, garment):
        task = TryonTask(
            person_image_url="images/person.png",
            garment_id=garment.id,
            status="completed",
            result_image_url="images/result.png",
        )
        session.add(task)
        session.commit()
        session.refresh(task)

        resp = client.get(f"/api/tryon/{task.id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "completed"
        assert "result_image_url" in data
        assert "person_image_url" in data

    def test_failed_task_includes_error(self, client, session, garment):
        task = TryonTask(
            person_image_url="images/person.png",
            garment_id=garment.id,
            status="failed",
            error="Fashn.ai timeout",
        )
        session.add(task)
        session.commit()
        session.refresh(task)

        resp = client.get(f"/api/tryon/{task.id}")
        assert resp.status_code == 200
        assert resp.json()["error"] == "Fashn.ai timeout"

    def test_nonexistent_task_returns_404(self, client):
        resp = client.get("/api/tryon/nonexistent-task-id")
        assert resp.status_code == 404


class TestTryonHistory:
    def test_requires_authentication(self, client):
        resp = client.get("/api/tryon/history")
        assert resp.status_code == 401

    def test_returns_only_current_users_tasks(self, client, session, garment, registered_user, auth_headers):
        user_id = registered_user["user"]["id"]
        my_task = TryonTask(
            person_image_url="images/p.png",
            garment_id=garment.id,
            user_id=user_id,
            status="pending",
        )
        other_task = TryonTask(
            person_image_url="images/p2.png",
            garment_id=garment.id,
            user_id=None,  # anonymous
            status="pending",
        )
        session.add(my_task)
        session.add(other_task)
        session.commit()

        resp = client.get("/api/tryon/history", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["task_id"] == my_task.id

    def test_returns_tasks_in_descending_order(self, client, session, garment, registered_user, auth_headers):
        from datetime import datetime, timedelta, timezone

        user_id = registered_user["user"]["id"]
        older = TryonTask(
            person_image_url="images/p1.png",
            garment_id=garment.id,
            user_id=user_id,
            status="pending",
            created_at=datetime.now(timezone.utc) - timedelta(hours=1),
        )
        newer = TryonTask(
            person_image_url="images/p2.png",
            garment_id=garment.id,
            user_id=user_id,
            status="pending",
            created_at=datetime.now(timezone.utc),
        )
        session.add(older)
        session.add(newer)
        session.commit()
        session.refresh(older)
        session.refresh(newer)

        resp = client.get("/api/tryon/history", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert data[0]["task_id"] == newer.id


class TestDeleteTryon:
    def test_requires_authentication(self, client, session, garment):
        task = TryonTask(person_image_url="images/p.png", garment_id=garment.id)
        session.add(task)
        session.commit()

        resp = client.delete(f"/api/tryon/{task.id}")
        assert resp.status_code == 401

    def test_nonexistent_task_returns_404(self, client, registered_user, auth_headers):
        resp = client.delete("/api/tryon/nonexistent-task-id", headers=auth_headers)
        assert resp.status_code == 404

    def test_other_users_task_returns_404(self, client, session, garment, registered_user, auth_headers):
        # Owned by nobody (anonymous task) — not the logged-in user, so must not be deletable by them.
        other_task = TryonTask(person_image_url="images/p.png", garment_id=garment.id, user_id=None)
        session.add(other_task)
        session.commit()

        resp = client.delete(f"/api/tryon/{other_task.id}", headers=auth_headers)
        assert resp.status_code == 404

    def test_owner_can_delete_and_images_are_cleaned_up(
        self, client, session, garment, registered_user, auth_headers
    ):
        user_id = registered_user["user"]["id"]
        task = TryonTask(
            person_image_url="person-images/p.png",
            garment_id=garment.id,
            user_id=user_id,
            status="completed",
            result_image_url="result-images/r.png",
        )
        session.add(task)
        session.commit()
        session.refresh(task)
        task_id = task.id

        with patch("app.api.tryon.delete_image") as mock_delete:
            resp = client.delete(f"/api/tryon/{task_id}", headers=auth_headers)

        assert resp.status_code == 204
        mock_delete.assert_any_call("person-images/p.png")
        mock_delete.assert_any_call("result-images/r.png")
        assert session.get(TryonTask, task_id) is None
