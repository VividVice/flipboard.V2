from unittest.mock import AsyncMock, patch

import pytest
from fastapi import status
from httpx import ASGITransport, AsyncClient

pytestmark = pytest.mark.anyio


@pytest.fixture
def app():
    from app.main import app
    return app


def mock_auth(test_user):
    """Helper to create auth mocks."""
    return {
        "app.dependencies.verify_token": {"sub": test_user["id"]},
        "app.dependencies.get_user_by_id": test_user,
    }


# ============================================================================
# GET /articles/{article_id}/comments Tests
# ============================================================================


@patch("app.routes.comments.comment_crud")
@patch("app.routes.comments.article_crud")
async def test_get_article_comments(mock_article_crud, mock_comment_crud, app, test_article, test_comment_with_user):
    # GIVEN article exists with comments
    mock_article_crud.get_article_by_id = AsyncMock(return_value=test_article)
    mock_comment_crud.get_comments_by_article = AsyncMock(return_value=[test_comment_with_user])

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # WHEN get comments is called
        response = await client.get(f"/articles/{test_article['id']}/comments")

    # THEN comments are returned
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["content"] == test_comment_with_user["content"]


@patch("app.routes.comments.article_crud")
async def test_get_article_comments_article_not_found(mock_article_crud, app):
    # GIVEN article doesn't exist
    mock_article_crud.get_article_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # WHEN get comments is called
        response = await client.get("/articles/nonexistent-id/comments")

    # THEN 404 is returned
    assert response.status_code == status.HTTP_404_NOT_FOUND


@patch("app.routes.comments.comment_crud")
@patch("app.routes.comments.article_crud")
async def test_get_article_comments_with_pagination(mock_article_crud, mock_comment_crud, app, test_article):
    # GIVEN article exists
    mock_article_crud.get_article_by_id = AsyncMock(return_value=test_article)
    mock_comment_crud.get_comments_by_article = AsyncMock(return_value=[])

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # WHEN get comments with pagination
        response = await client.get(
            f"/articles/{test_article['id']}/comments",
            params={"skip": 10, "limit": 5}
        )

    # THEN pagination params are passed
    assert response.status_code == status.HTTP_200_OK
    mock_comment_crud.get_comments_by_article.assert_awaited_with(
        test_article['id'], skip=10, limit=5
    )


# ============================================================================
# POST /articles/{article_id}/comments Tests
# ============================================================================


@patch("app.routes.comments.article_crud")
@patch("app.routes.comments.comment_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_create_comment(mock_verify, mock_get_user, mock_comment_crud, mock_article_crud, app, test_user, test_article, test_comment_with_user):
    # GIVEN authenticated user and article exists
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_article_by_id = AsyncMock(return_value=test_article)
    mock_article_crud.increment_comment_count = AsyncMock()
    mock_comment_crud.create_comment = AsyncMock(return_value=test_comment_with_user)

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # WHEN create comment is called
        response = await client.post(
            f"/articles/{test_article['id']}/comments",
            json={"content": "New comment"},
            headers={"Authorization": "Bearer valid-token"}
        )

    # THEN comment is created
    assert response.status_code == status.HTTP_201_CREATED
    mock_article_crud.increment_comment_count.assert_awaited_with(test_article['id'], 1)


@patch("app.routes.comments.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_create_comment_article_not_found(mock_verify, mock_get_user, mock_article_crud, app, test_user):
    # GIVEN article doesn't exist
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_article_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # WHEN create comment is called
        response = await client.post(
            "/articles/nonexistent-id/comments",
            json={"content": "New comment"},
            headers={"Authorization": "Bearer valid-token"}
        )

    # THEN 404 is returned
    assert response.status_code == status.HTTP_404_NOT_FOUND


async def test_create_comment_unauthorized(app, test_article):
    # GIVEN no auth token
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # WHEN create comment is called
        response = await client.post(
            f"/articles/{test_article['id']}/comments",
            json={"content": "New comment"}
        )

    # THEN unauthorized is returned
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# PUT /comments/{comment_id} Tests
# ============================================================================


@patch("app.routes.comments.comment_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_update_comment(mock_verify, mock_get_user, mock_comment_crud, app, test_user, test_comment):
    # GIVEN authenticated user owns the comment
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_comment_crud.get_comment_by_id = AsyncMock(return_value=test_comment)
    updated_comment = {**test_comment, "content": "Updated content"}
    mock_comment_crud.update_comment = AsyncMock(return_value=updated_comment)

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # WHEN update comment is called
        response = await client.put(
            f"/comments/{test_comment['id']}",
            json={"content": "Updated content"},
            headers={"Authorization": "Bearer valid-token"}
        )

    # THEN comment is updated
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["content"] == "Updated content"


@patch("app.routes.comments.comment_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_update_comment_not_found(mock_verify, mock_get_user, mock_comment_crud, app, test_user):
    # GIVEN comment doesn't exist
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_comment_crud.get_comment_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # WHEN update comment is called
        response = await client.put(
            "/comments/nonexistent-id",
            json={"content": "Updated content"},
            headers={"Authorization": "Bearer valid-token"}
        )

    # THEN 404 is returned
    assert response.status_code == status.HTTP_404_NOT_FOUND


@patch("app.routes.comments.comment_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_update_comment_not_owner(mock_verify, mock_get_user, mock_comment_crud, app, test_user, test_comment):
    # GIVEN user doesn't own the comment
    different_user = {**test_user, "id": "different-user-id"}
    mock_verify.return_value = {"sub": different_user["id"]}
    mock_get_user.return_value = different_user
    mock_comment_crud.get_comment_by_id = AsyncMock(return_value=test_comment)

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # WHEN update comment is called
        response = await client.put(
            f"/comments/{test_comment['id']}",
            json={"content": "Updated content"},
            headers={"Authorization": "Bearer valid-token"}
        )

    # THEN 403 is returned
    assert response.status_code == status.HTTP_403_FORBIDDEN


# ============================================================================
# DELETE /comments/{comment_id} Tests
# ============================================================================


@patch("app.routes.comments.article_crud")
@patch("app.routes.comments.comment_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_delete_comment(mock_verify, mock_get_user, mock_comment_crud, mock_article_crud, app, test_user, test_comment):
    # GIVEN authenticated user owns the comment
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_comment_crud.get_comment_by_id = AsyncMock(return_value=test_comment)
    mock_comment_crud.delete_comment = AsyncMock()
    mock_article_crud.increment_comment_count = AsyncMock()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # WHEN delete comment is called
        response = await client.delete(
            f"/comments/{test_comment['id']}",
            headers={"Authorization": "Bearer valid-token"}
        )

    # THEN comment is deleted and count decremented
    assert response.status_code == status.HTTP_204_NO_CONTENT
    mock_article_crud.increment_comment_count.assert_awaited_with(test_comment['article_id'], -1)


@patch("app.routes.comments.comment_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_delete_comment_not_found(mock_verify, mock_get_user, mock_comment_crud, app, test_user):
    # GIVEN comment doesn't exist
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_comment_crud.get_comment_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # WHEN delete comment is called
        response = await client.delete(
            "/comments/nonexistent-id",
            headers={"Authorization": "Bearer valid-token"}
        )

    # THEN 404 is returned
    assert response.status_code == status.HTTP_404_NOT_FOUND


@patch("app.routes.comments.comment_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_delete_comment_not_owner(mock_verify, mock_get_user, mock_comment_crud, app, test_user, test_comment):
    # GIVEN user doesn't own the comment
    different_user = {**test_user, "id": "different-user-id"}
    mock_verify.return_value = {"sub": different_user["id"]}
    mock_get_user.return_value = different_user
    mock_comment_crud.get_comment_by_id = AsyncMock(return_value=test_comment)

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # WHEN delete comment is called
        response = await client.delete(
            f"/comments/{test_comment['id']}",
            headers={"Authorization": "Bearer valid-token"}
        )

    # THEN 403 is returned
    assert response.status_code == status.HTTP_403_FORBIDDEN


# ============================================================================
# GET /users/me/comments Tests
# ============================================================================


@patch("app.routes.comments.comment_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_my_comments(mock_verify, mock_get_user, mock_comment_crud, app, test_user, test_comment_with_user):
    # GIVEN authenticated user has comments
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_comment_crud.get_comments_by_user = AsyncMock(return_value=[test_comment_with_user])

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # WHEN get my comments is called
        response = await client.get(
            "/users/me/comments",
            headers={"Authorization": "Bearer valid-token"}
        )

    # THEN user's comments are returned
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1


# ============================================================================
# GET /users/{user_id}/comments Tests
# ============================================================================


@patch("app.routes.comments.comment_crud")
async def test_get_user_comments(mock_comment_crud, app, test_user, test_comment_with_user):
    # GIVEN user has comments
    mock_comment_crud.get_comments_by_user = AsyncMock(return_value=[test_comment_with_user])

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        # WHEN get user comments is called
        response = await client.get(f"/users/{test_user['id']}/comments")

    # THEN user's comments are returned
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1
