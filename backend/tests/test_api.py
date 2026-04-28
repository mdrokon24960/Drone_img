import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_images():
    response = client.get("/api/images")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_history():
    response = client.get("/api/history")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data

def test_health_check():
    # Simple check if docs are accessible
    response = client.get("/docs")
    assert response.status_code == 200
