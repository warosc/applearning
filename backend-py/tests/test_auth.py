"""Tests for authentication endpoints"""
import pytest


def test_login_success(client, admin_user):
    r = client.post("/api/auth/login", json={"username": "testadmin", "password": "admin123"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["user"]["username"] == "testadmin"
    assert data["user"]["role"] == "admin"


def test_login_wrong_password(client, admin_user):
    r = client.post("/api/auth/login", json={"username": "testadmin", "password": "wrong"})
    assert r.status_code == 401


def test_login_unknown_user(client):
    r = client.post("/api/auth/login", json={"username": "nobody", "password": "test"})
    assert r.status_code == 401


def test_register_success(client):
    r = client.post("/api/auth/register", json={
        "username": "newuser",
        "password": "pass123",
        "name": "New User"
    })
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["user"]["role"] == "estudiante"
    assert data["user"]["username"] == "newuser"


def test_register_duplicate_username(client, student_user):
    r = client.post("/api/auth/register", json={
        "username": "teststudent",
        "password": "somepass"
    })
    assert r.status_code == 409


def test_register_short_password(client):
    r = client.post("/api/auth/register", json={
        "username": "validuser",
        "password": "ab"
    })
    assert r.status_code == 422


def test_me_requires_auth(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def test_me_returns_current_user(client, admin_user):
    login = client.post("/api/auth/login", json={"username": "testadmin", "password": "admin123"})
    token = login.json()["access_token"]
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["username"] == "testadmin"
