import importlib
from datetime import timedelta

import pytest
from jose import jwt

from app.core import config

# To be tested
from app.security import token as token_service


@pytest.fixture(autouse=True)
def reload_modules(monkeypatch):
    """
    Fixture to set environment variables and reload modules that depend on them.
    This ensures that the settings are updated before the functions are called.
    """
    monkeypatch.setenv("SECRET_KEY", "test_secret_key")
    monkeypatch.setenv("ALGORITHM", "HS256")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    # The following envs are not used in this test but are required by the Settings model
    monkeypatch.setenv("MONGODB_URL", "mongodb://test:test@localhost:27017")
    monkeypatch.setenv("MONGODB_DATABASE", "testdb")

    importlib.reload(config)
    importlib.reload(token_service)


def test_create_access_token():
    """
    Tests the creation of a JWT access token.
    """
    # GIVEN some user data and an expiration delta
    data = {"sub": "testuser"}
    expires_delta = timedelta(minutes=15)

    # WHEN the token is created
    token = token_service.create_access_token(data, expires_delta)

    # THEN the token can be decoded and contains the correct data
    decoded_token = jwt.decode(
        token, config.settings.SECRET_KEY, algorithms=[config.settings.ALGORITHM]
    )

    assert decoded_token["sub"] == "testuser"
    assert "exp" in decoded_token


def test_create_access_token_default_expiration():
    """
    Tests token creation with default expiration (no expires_delta).
    """
    data = {"sub": "testuser"}

    token = token_service.create_access_token(data)

    decoded_token = jwt.decode(
        token, config.settings.SECRET_KEY, algorithms=[config.settings.ALGORITHM]
    )
    assert decoded_token["sub"] == "testuser"
    assert "exp" in decoded_token


def test_verify_token_valid():
    """
    Tests verifying a valid JWT token.
    """
    data = {"sub": "testuser"}
    token = token_service.create_access_token(data, timedelta(minutes=15))

    result = token_service.verify_token(token)

    assert result is not None
    assert result["sub"] == "testuser"


def test_verify_token_invalid():
    """
    Tests verifying an invalid JWT token.
    """
    result = token_service.verify_token("invalid-token-string")

    assert result is None


def test_verify_token_expired():
    """
    Tests verifying an expired JWT token.
    """
    data = {"sub": "testuser"}
    # Create token that expired 1 hour ago
    token = token_service.create_access_token(data, timedelta(hours=-1))

    result = token_service.verify_token(token)

    assert result is None
