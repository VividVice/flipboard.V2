from unittest.mock import AsyncMock, patch

import pytest
from fastapi import status
from httpx import ASGITransport, AsyncClient

pytestmark = pytest.mark.anyio


@pytest.fixture
def app():
    from app.main import app

    return app


# ============================================================================
# GET /users/{username} Tests
# ============================================================================


@patch("app.routes.users.user_crud")
async def test_get_user_by_username(mock_user_crud, app, test_user):
    # GIVEN user exists
    mock_user_crud.get_user_by_username = AsyncMock(return_value=test_user)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get user by username is called
        response = await client.get(f"/users/{test_user['username']}")

    # THEN user is returned
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["username"] == test_user["username"]


@patch("app.routes.users.user_crud")
async def test_get_user_by_username_not_found(mock_user_crud, app):
    # GIVEN user doesn't exist
    mock_user_crud.get_user_by_username = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get user by username is called
        response = await client.get("/users/nonexistent")

    # THEN 404 is returned
    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# GET /users/id/{user_id} Tests
# ============================================================================


@patch("app.routes.users.user_crud")
async def test_get_user_by_id(mock_user_crud, app, test_user):
    # GIVEN user exists
    mock_user_crud.get_user_by_id = AsyncMock(return_value=test_user)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get user by id is called
        response = await client.get(f"/users/id/{test_user['id']}")

    # THEN user is returned
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == test_user["id"]


@patch("app.routes.users.user_crud")
async def test_get_user_by_id_not_found(mock_user_crud, app):
    # GIVEN user doesn't exist
    mock_user_crud.get_user_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get user by id is called
        response = await client.get("/users/id/nonexistent")

    # THEN 404 is returned
    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# POST /users/list Tests
# ============================================================================


@patch("app.routes.users.user_crud")
async def test_get_users_list(mock_user_crud, app, test_user, test_user_2):
    # GIVEN users exist
    mock_user_crud.get_users_by_ids = AsyncMock(return_value=[test_user, test_user_2])

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get users list is called
        response = await client.post(
            "/users/list", json=[test_user["id"], test_user_2["id"]]
        )

    # THEN users are returned
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 2


# ============================================================================
# PUT /users/me Tests
# ============================================================================


@patch("app.routes.users.user_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_update_user_me(
    mock_verify, mock_get_user, mock_user_crud, app, test_user
):
    # GIVEN authenticated user
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_user_crud.update_user = AsyncMock(return_value=True)
    updated_user = {**test_user, "bio": "Updated bio"}
    mock_user_crud.get_user_by_id = AsyncMock(return_value=updated_user)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN update is called
        response = await client.put(
            "/users/me",
            json={"bio": "Updated bio"},
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN user is updated
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["bio"] == "Updated bio"


@patch("app.routes.users.user_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_update_user_me_username_taken(
    mock_verify, mock_get_user, mock_user_crud, app, test_user, test_user_2
):
    # GIVEN username is taken
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_user_crud.get_user_by_username = AsyncMock(return_value=test_user_2)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN update with taken username is called
        response = await client.put(
            "/users/me",
            json={"username": test_user_2["username"]},
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN error is returned
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already taken" in response.json()["detail"]


@patch("app.routes.users.user_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_update_user_me_same_username(
    mock_verify, mock_get_user, mock_user_crud, app, test_user
):
    # GIVEN user updates with same username
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_user_crud.get_user_by_username = AsyncMock(return_value=test_user)
    mock_user_crud.update_user = AsyncMock(return_value=True)
    mock_user_crud.get_user_by_id = AsyncMock(return_value=test_user)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN update with same username is called
        response = await client.put(
            "/users/me",
            json={"username": test_user["username"]},
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN update succeeds
    assert response.status_code == status.HTTP_200_OK


async def test_update_user_me_unauthorized(app):
    # GIVEN no auth token
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN update is called
        response = await client.put("/users/me", json={"bio": "Updated bio"})

    # THEN unauthorized is returned
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# POST /users/{user_id}/follow Tests
# ============================================================================


@patch("app.routes.users.user_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_follow_user(
    mock_verify, mock_get_user, mock_user_crud, app, test_user, test_user_2
):
    # GIVEN authenticated user wants to follow another user
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_user_crud.get_user_by_id = AsyncMock(return_value=test_user_2)
    mock_user_crud.follow_user = AsyncMock()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN follow is called
        response = await client.post(
            f"/users/{test_user_2['id']}/follow",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN user is followed
    assert response.status_code == status.HTTP_200_OK
    mock_user_crud.follow_user.assert_awaited_once()


@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_follow_self(mock_verify, mock_get_user, app, test_user):
    # GIVEN user tries to follow themselves
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN follow self is called
        response = await client.post(
            f"/users/{test_user['id']}/follow",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN error is returned
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "cannot follow yourself" in response.json()["detail"]


@patch("app.routes.users.user_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_follow_user_not_found(
    mock_verify, mock_get_user, mock_user_crud, app, test_user
):
    # GIVEN target user doesn't exist
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_user_crud.get_user_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN follow is called
        response = await client.post(
            "/users/nonexistent/follow", headers={"Authorization": "Bearer valid-token"}
        )

    # THEN 404 is returned
    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# POST /users/{user_id}/unfollow Tests
# ============================================================================


@patch("app.routes.users.user_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_unfollow_user(
    mock_verify, mock_get_user, mock_user_crud, app, test_user, test_user_2
):
    # GIVEN authenticated user wants to unfollow another user
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_user_crud.get_user_by_id = AsyncMock(return_value=test_user_2)
    mock_user_crud.unfollow_user = AsyncMock()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN unfollow is called
        response = await client.post(
            f"/users/{test_user_2['id']}/unfollow",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN user is unfollowed
    assert response.status_code == status.HTTP_200_OK
    mock_user_crud.unfollow_user.assert_awaited_once()


@patch("app.routes.users.user_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_unfollow_user_not_found(
    mock_verify, mock_get_user, mock_user_crud, app, test_user
):
    # GIVEN target user doesn't exist
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_user_crud.get_user_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN unfollow is called
        response = await client.post(
            "/users/nonexistent/unfollow",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN 404 is returned
    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# POST /users/newsletter/trigger Tests
# ============================================================================


@patch("app.routes.users.process_weekly_newsletter")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_trigger_newsletter(
    mock_verify, mock_get_user, mock_newsletter, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_newsletter.return_value = None

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/users/newsletter/trigger",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK
    assert "triggered" in response.json()["message"].lower()
    mock_newsletter.assert_awaited_once()


async def test_trigger_newsletter_unauthorized(app):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post("/users/newsletter/trigger")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# PUT /users/me - no changes Tests
# ============================================================================


@patch("app.routes.users.user_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_update_user_me_no_changes(
    mock_verify, mock_get_user, mock_user_crud, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_user_crud.update_user = AsyncMock(return_value=False)
    mock_user_crud.get_user_by_id = AsyncMock(return_value=test_user)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.put(
            "/users/me",
            json={},
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == test_user["id"]
