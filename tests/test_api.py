import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db import init_db

client = TestClient(app)

def setup_module():
    init_db()

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["symbols_count"] >= 3

def test_login_success():
    response = client.post("/api/auth/login", json={"username": "parth", "password": "demo123"})
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["username"] == "parth"
    assert data["user"]["name"] == "Parth Kala"

def test_login_invalid():
    response = client.post("/api/auth/login", json={"username": "parth", "password": "wrongpassword"})
    assert response.status_code == 401

def test_get_symbols():
    response = client.get("/api/symbols")
    assert response.status_code == 200
    symbols = response.json()
    assert len(symbols) >= 3
    ids = [s["id"] for s in symbols]
    assert "lighting_fixture" in ids
    assert "power_outlet" in ids
    assert "switch" in ids
