"""CORS should only allow whitelisted origins, not '*'."""


class TestCorsOrigins:
    def test_whitelisted_origin_is_echoed_back(self, client):
        resp = client.get("/api/garments", headers={"Origin": "http://localhost:3000"})
        assert resp.headers.get("access-control-allow-origin") == "http://localhost:3000"

    def test_unlisted_origin_gets_no_cors_header(self, client):
        resp = client.get("/api/garments", headers={"Origin": "https://evil.example.com"})
        assert "access-control-allow-origin" not in resp.headers
