import pytest
from jose import jwt
from datetime import timedelta
import importlib

# To be tested
from app.security import token as token_service
from app.core import config

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
