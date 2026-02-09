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
# POST /articles/{article_id}/like Tests
# ============================================================================


@patch("app.routes.interactions.article_crud")
@patch("app.routes.interactions.interaction_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_toggle_like_article(
    mock_verify,
    mock_get_user,
    mock_interaction_crud,
    mock_article_crud,
    app,
    test_user,
    test_article,
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_article_by_id = AsyncMock(return_value=test_article)
    mock_interaction_crud.toggle_like = AsyncMock(
        return_value=({"is_liked": True, "is_saved": False}, 1)
    )
    mock_article_crud.increment_like_count = AsyncMock()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            f"/articles/{test_article['id']}/like",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["article_id"] == test_article["id"]
    assert data["is_liked"] is True
    assert data["is_saved"] is False
    mock_article_crud.increment_like_count.assert_awaited_once()


@patch("app.routes.interactions.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_toggle_like_article_not_found(
    mock_verify, mock_get_user, mock_article_crud, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_article_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/articles/nonexistent/like",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_404_NOT_FOUND


async def test_toggle_like_unauthorized(app):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post("/articles/test-id/like")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# POST /articles/{article_id}/save Tests
# ============================================================================


@patch("app.routes.interactions.article_crud")
@patch("app.routes.interactions.interaction_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_toggle_save_article(
    mock_verify,
    mock_get_user,
    mock_interaction_crud,
    mock_article_crud,
    app,
    test_user,
    test_article,
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_article_by_id = AsyncMock(return_value=test_article)
    mock_interaction_crud.toggle_save = AsyncMock(
        return_value={"is_liked": False, "is_saved": True}
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            f"/articles/{test_article['id']}/save",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["is_saved"] is True


@patch("app.routes.interactions.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_toggle_save_article_not_found(
    mock_verify, mock_get_user, mock_article_crud, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_article_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/articles/nonexistent/save",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# GET /articles/{article_id}/status Tests
# ============================================================================


@patch("app.routes.interactions.interaction_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_interaction_status_exists(
    mock_verify,
    mock_get_user,
    mock_interaction_crud,
    app,
    test_user,
    test_article,
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_interaction_crud.get_interaction = AsyncMock(
        return_value={"is_liked": True, "is_saved": True}
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            f"/articles/{test_article['id']}/status",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["is_liked"] is True
    assert data["is_saved"] is True


@patch("app.routes.interactions.interaction_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_interaction_status_not_exists(
    mock_verify, mock_get_user, mock_interaction_crud, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_interaction_crud.get_interaction = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/articles/some-id/status",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["is_liked"] is False
    assert data["is_saved"] is False


# ============================================================================
# GET /me/liked Tests
# ============================================================================


@patch("app.routes.interactions.enrich_articles")
@patch("app.routes.interactions.interaction_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_liked_articles(
    mock_verify, mock_get_user, mock_interaction_crud, mock_enrich, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_interaction_crud.get_user_liked_articles = AsyncMock(return_value=[])
    mock_enrich.return_value = []

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/me/liked",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


# ============================================================================
# GET /me/saved Tests
# ============================================================================


@patch("app.routes.interactions.enrich_articles")
@patch("app.routes.interactions.interaction_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_saved_articles(
    mock_verify, mock_get_user, mock_interaction_crud, mock_enrich, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_interaction_crud.get_user_saved_articles = AsyncMock(return_value=[])
    mock_enrich.return_value = []

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/me/saved",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []
