from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import status
from httpx import ASGITransport, AsyncClient

pytestmark = pytest.mark.anyio


@pytest.fixture
def app():
    from app.main import app

    return app


# ============================================================================
# POST /auth/signup Tests
# ============================================================================


@patch("app.routes.auth.user_crud")
async def test_signup_success(mock_user_crud, app):
    # GIVEN valid signup data
    from datetime import datetime

    mock_user_crud.get_user_by_email = AsyncMock(return_value=None)
    mock_user_crud.get_user_by_username = AsyncMock(return_value=None)
    mock_user_crud.create_user = AsyncMock(
        return_value={
            "id": "abcdef12-3456-7890-abcd-ef1234567890",
            "email": "new@example.com",
            "username": "newuser",
            "bio": "",
            "profile_pic": None,
            "followed_topics": [],
            "followers": [],
            "following": [],
            "newsletter_subscribed": False,
            "created_at": datetime(2024, 1, 1, 0, 0, 0),
        }
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN signup is called
        response = await client.post(
            "/auth/signup",
            json={
                "email": "new@example.com",
                "username": "newuser",
                "password": "password123",
            },
        )

    # THEN user is created
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "new@example.com"
    assert data["username"] == "newuser"


@patch("app.routes.auth.user_crud")
async def test_signup_email_already_exists(mock_user_crud, app):
    # GIVEN email already registered
    mock_user_crud.get_user_by_email = AsyncMock(
        return_value={"email": "existing@example.com"}
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN signup is called
        response = await client.post(
            "/auth/signup",
            json={
                "email": "existing@example.com",
                "username": "newuser",
                "password": "password123",
            },
        )

    # THEN error is returned
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Email already registered" in response.json()["detail"]


@patch("app.routes.auth.user_crud")
async def test_signup_username_already_exists(mock_user_crud, app):
    # GIVEN username already registered
    mock_user_crud.get_user_by_email = AsyncMock(return_value=None)
    mock_user_crud.get_user_by_username = AsyncMock(
        return_value={"username": "existinguser"}
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN signup is called
        response = await client.post(
            "/auth/signup",
            json={
                "email": "new@example.com",
                "username": "existinguser",
                "password": "password123",
            },
        )

    # THEN error is returned
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Username already registered" in response.json()["detail"]


# ============================================================================
# POST /auth/login Tests
# ============================================================================


@patch("app.routes.auth.security_token")
@patch("app.routes.auth.user_crud")
async def test_login_success(mock_user_crud, mock_security, app):
    # GIVEN valid credentials
    mock_user_crud.authenticate_user = AsyncMock(
        return_value={
            "id": "user-id",
            "username": "testuser",
        }
    )
    mock_security.create_access_token = MagicMock(return_value="test-token")

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN login is called
        response = await client.post(
            "/auth/login", data={"username": "testuser", "password": "password123"}
        )

    # THEN token is returned
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["access_token"] == "test-token"
    assert data["token_type"] == "bearer"


@patch("app.routes.auth.user_crud")
async def test_login_invalid_credentials(mock_user_crud, app):
    # GIVEN invalid credentials
    mock_user_crud.authenticate_user = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN login is called
        response = await client.post(
            "/auth/login", data={"username": "wronguser", "password": "wrongpassword"}
        )

    # THEN unauthorized error is returned
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Incorrect username or password" in response.json()["detail"]


# ============================================================================
# GET /auth/me Tests
# ============================================================================


@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_me_success(mock_verify, mock_get_user, app, test_user):
    # GIVEN valid token and user exists
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN /auth/me is called
        response = await client.get(
            "/auth/me", headers={"Authorization": "Bearer valid-token"}
        )

    # THEN user info is returned
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_user["id"]
    assert data["email"] == test_user["email"]


async def test_get_me_no_token(app):
    # GIVEN no token provided
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN /auth/me is called
        response = await client.get("/auth/me")

    # THEN unauthorized error is returned
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@patch("app.dependencies.verify_token")
async def test_get_me_invalid_token(mock_verify, app):
    # GIVEN invalid token
    mock_verify.return_value = None

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN /auth/me is called
        response = await client.get(
            "/auth/me", headers={"Authorization": "Bearer invalid-token"}
        )

    # THEN unauthorized error is returned
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_me_user_not_found(mock_verify, mock_get_user, app):
    # GIVEN valid token but user doesn't exist
    mock_verify.return_value = {"sub": "deleted-user-id"}
    mock_get_user.return_value = None

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN /auth/me is called
        response = await client.get(
            "/auth/me", headers={"Authorization": "Bearer valid-token"}
        )

    # THEN unauthorized error is returned
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# POST /auth/google Tests
# ============================================================================


@patch("app.routes.auth.security_token")
@patch("app.routes.auth.user_crud")
@patch("app.routes.auth.id_token")
@patch("app.routes.auth.settings")
async def test_google_login_existing_user(
    mock_settings, mock_id_token, mock_user_crud, mock_security, app
):
    # GIVEN valid Google token and user exists
    mock_settings.GOOGLE_CLIENT_ID = "test-client-id"
    mock_id_token.verify_oauth2_token = MagicMock(
        return_value={
            "email": "google@example.com",
            "picture": "https://example.com/pic.jpg",
        }
    )
    mock_user_crud.get_user_by_email = AsyncMock(
        return_value={
            "id": "existing-user-id",
            "email": "google@example.com",
        }
    )
    mock_security.create_access_token = MagicMock(return_value="google-token")

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN Google login is called
        response = await client.post(
            "/auth/google", json={"token": "valid-google-token"}
        )

    # THEN token is returned
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["access_token"] == "google-token"


@patch("app.routes.auth.security_token")
@patch("app.routes.auth.user_crud")
@patch("app.routes.auth.id_token")
@patch("app.routes.auth.settings")
async def test_google_login_new_user(
    mock_settings, mock_id_token, mock_user_crud, mock_security, app
):
    # GIVEN valid Google token and user doesn't exist
    mock_settings.GOOGLE_CLIENT_ID = "test-client-id"
    mock_id_token.verify_oauth2_token = MagicMock(
        return_value={
            "email": "newgoogle@example.com",
            "picture": "https://example.com/pic.jpg",
        }
    )
    mock_user_crud.get_user_by_email = AsyncMock(return_value=None)
    mock_user_crud.get_user_by_username = AsyncMock(return_value=None)
    mock_user_crud.create_social_user = AsyncMock(
        return_value={
            "id": "new-google-user-id",
            "email": "newgoogle@example.com",
        }
    )
    mock_security.create_access_token = MagicMock(return_value="new-google-token")

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN Google login is called
        response = await client.post(
            "/auth/google", json={"token": "valid-google-token"}
        )

    # THEN new user is created and token is returned
    assert response.status_code == status.HTTP_200_OK
    mock_user_crud.create_social_user.assert_awaited_once()


@patch("app.routes.auth.id_token")
@patch("app.routes.auth.settings")
async def test_google_login_invalid_token(mock_settings, mock_id_token, app):
    # GIVEN invalid Google token
    mock_settings.GOOGLE_CLIENT_ID = "test-client-id"
    mock_id_token.verify_oauth2_token = MagicMock(
        side_effect=ValueError("Invalid token")
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN Google login is called
        response = await client.post(
            "/auth/google", json={"token": "invalid-google-token"}
        )

    # THEN unauthorized error is returned
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Invalid Google token" in response.json()["detail"]


@patch("app.routes.auth.settings")
async def test_google_login_not_configured(mock_settings, app):
    # GIVEN Google OAuth not configured
    mock_settings.GOOGLE_CLIENT_ID = None

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN Google login is called
        response = await client.post("/auth/google", json={"token": "some-token"})

    # THEN error is returned
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


# ============================================================================
# POST /auth/google Edge Cases
# ============================================================================


@patch("app.routes.auth.id_token")
@patch("app.routes.auth.settings")
async def test_google_login_no_email(mock_settings, mock_id_token, app):
    # GIVEN Google token with no email
    mock_settings.GOOGLE_CLIENT_ID = "test-client-id"
    mock_id_token.verify_oauth2_token = MagicMock(
        return_value={"name": "Test User", "picture": "pic.jpg"}
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/auth/google", json={"token": "valid-google-token"}
        )

    # THEN 400 is returned
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Email not provided" in response.json()["detail"]


@patch("app.routes.auth.security_token")
@patch("app.routes.auth.user_crud")
@patch("app.routes.auth.id_token")
@patch("app.routes.auth.settings")
async def test_google_login_username_collision(
    mock_settings, mock_id_token, mock_user_crud, mock_security, app
):
    # GIVEN valid Google token, user doesn't exist, but username taken
    mock_settings.GOOGLE_CLIENT_ID = "test-client-id"
    mock_id_token.verify_oauth2_token = MagicMock(
        return_value={"email": "john@example.com", "picture": None}
    )
    mock_user_crud.get_user_by_email = AsyncMock(return_value=None)
    # First call: "john" is taken, second call: "john1" is free
    mock_user_crud.get_user_by_username = AsyncMock(
        side_effect=[{"username": "john"}, None]
    )
    mock_user_crud.create_social_user = AsyncMock(
        return_value={"id": "new-id", "email": "john@example.com"}
    )
    mock_security.create_access_token = MagicMock(return_value="token")

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/auth/google", json={"token": "valid-google-token"}
        )

    assert response.status_code == status.HTTP_200_OK
    # Verify the username was incremented
    create_call = mock_user_crud.create_social_user.call_args[0][0]
    assert create_call["username"] == "john1"


@patch("app.routes.auth.security_token")
@patch("app.routes.auth.user_crud")
@patch("app.routes.auth.id_token")
@patch("app.routes.auth.settings")
async def test_google_login_no_picture(
    mock_settings, mock_id_token, mock_user_crud, mock_security, app
):
    # GIVEN Google token with empty picture
    mock_settings.GOOGLE_CLIENT_ID = "test-client-id"
    mock_id_token.verify_oauth2_token = MagicMock(
        return_value={"email": "user@example.com", "picture": ""}
    )
    mock_user_crud.get_user_by_email = AsyncMock(return_value=None)
    mock_user_crud.get_user_by_username = AsyncMock(return_value=None)
    mock_user_crud.create_social_user = AsyncMock(
        return_value={"id": "new-id", "email": "user@example.com"}
    )
    mock_security.create_access_token = MagicMock(return_value="token")

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/auth/google", json={"token": "valid-google-token"}
        )

    assert response.status_code == status.HTTP_200_OK
    create_call = mock_user_crud.create_social_user.call_args[0][0]
    assert create_call["profile_pic"] is None
