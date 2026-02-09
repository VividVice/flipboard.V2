from datetime import datetime
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
# POST /magazines/ Tests
# ============================================================================


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_create_magazine(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user, test_magazine
):
    # GIVEN authenticated user
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.create_magazine = AsyncMock(return_value=test_magazine)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN create magazine is called
        response = await client.post(
            "/magazines/",
            json={"name": "Test Magazine", "description": "Test description"},
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN magazine is created
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["name"] == test_magazine["name"]


async def test_create_magazine_unauthorized(app):
    # GIVEN no auth token
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN create magazine is called
        response = await client.post("/magazines/", json={"name": "Test Magazine"})

    # THEN unauthorized is returned
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# GET /magazines/ Tests
# ============================================================================


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_user_magazines(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user, test_magazine
):
    # GIVEN authenticated user with magazines
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_user_magazines = AsyncMock(return_value=[test_magazine])
    mock_magazine_crud.enrich_magazines_with_covers = AsyncMock(
        return_value=[test_magazine]
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get magazines is called
        response = await client.get(
            "/magazines/", headers={"Authorization": "Bearer valid-token"}
        )

    # THEN user's magazines are returned
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1


# ============================================================================
# GET /magazines/{magazine_id} Tests
# ============================================================================


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_magazine(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user, test_magazine
):
    # GIVEN authenticated user and magazine exists
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=test_magazine)
    mock_magazine_crud.enrich_magazines_with_covers = AsyncMock(
        return_value=[test_magazine]
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get magazine is called
        response = await client.get(
            f"/magazines/{test_magazine['id']}",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN magazine is returned
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == test_magazine["id"]


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_magazine_not_found(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user
):
    # GIVEN magazine doesn't exist
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get magazine is called
        response = await client.get(
            "/magazines/nonexistent-id", headers={"Authorization": "Bearer valid-token"}
        )

    # THEN 404 is returned
    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# PUT /magazines/{magazine_id} Tests
# ============================================================================


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_update_magazine(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user, test_magazine
):
    # GIVEN authenticated user owns the magazine
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=test_magazine)
    mock_magazine_crud.update_magazine = AsyncMock(return_value=True)
    updated_magazine = {**test_magazine, "name": "Updated Name"}
    mock_magazine_crud.get_magazine_by_id = AsyncMock(
        side_effect=[test_magazine, updated_magazine]
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN update magazine is called
        response = await client.put(
            f"/magazines/{test_magazine['id']}",
            json={"name": "Updated Name"},
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN magazine is updated
    assert response.status_code == status.HTTP_200_OK


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_update_magazine_not_found(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user
):
    # GIVEN magazine doesn't exist
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.put(
            "/magazines/nonexistent",
            json={"name": "Updated"},
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_404_NOT_FOUND


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_update_magazine_not_owner(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user, test_magazine
):
    # GIVEN user doesn't own the magazine
    different_user = {**test_user, "id": "different-user-id"}
    mock_verify.return_value = {"sub": different_user["id"]}
    mock_get_user.return_value = different_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=test_magazine)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN update magazine is called
        response = await client.put(
            f"/magazines/{test_magazine['id']}",
            json={"name": "Updated Name"},
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN 403 is returned
    assert response.status_code == status.HTTP_403_FORBIDDEN


# ============================================================================
# DELETE /magazines/{magazine_id} Tests
# ============================================================================


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_delete_magazine(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user, test_magazine
):
    # GIVEN authenticated user owns the magazine
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=test_magazine)
    mock_magazine_crud.delete_magazine = AsyncMock()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN delete magazine is called
        response = await client.delete(
            f"/magazines/{test_magazine['id']}",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN magazine is deleted
    assert response.status_code == status.HTTP_200_OK
    assert "deleted" in response.json()["message"].lower()


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_delete_magazine_not_found(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user
):
    # GIVEN magazine doesn't exist
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.delete(
            "/magazines/nonexistent",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_404_NOT_FOUND


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_delete_magazine_not_owner(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user, test_magazine
):
    # GIVEN user doesn't own the magazine
    different_user = {**test_user, "id": "different-user-id"}
    mock_verify.return_value = {"sub": different_user["id"]}
    mock_get_user.return_value = different_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=test_magazine)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN delete magazine is called
        response = await client.delete(
            f"/magazines/{test_magazine['id']}",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN 403 is returned
    assert response.status_code == status.HTTP_403_FORBIDDEN


# ============================================================================
# POST /magazines/{magazine_id}/articles/{article_id} Tests
# ============================================================================


@patch("app.routes.magazines.crud_article")
@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_add_article_to_magazine(
    mock_verify,
    mock_get_user,
    mock_magazine_crud,
    mock_article_crud,
    app,
    test_user,
    test_magazine,
    test_article,
):
    # GIVEN user owns magazine and article exists
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=test_magazine)
    mock_article_crud.get_article_by_id = AsyncMock(return_value=test_article)
    mock_magazine_crud.add_article_to_magazine = AsyncMock()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN add article is called
        response = await client.post(
            f"/magazines/{test_magazine['id']}/articles/{test_article['id']}",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN article is added
    assert response.status_code == status.HTTP_200_OK
    mock_magazine_crud.add_article_to_magazine.assert_awaited_once()


@patch("app.routes.magazines.crud_article")
@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_add_article_magazine_not_found(
    mock_verify, mock_get_user, mock_magazine_crud, mock_article_crud, app, test_user
):
    # GIVEN magazine doesn't exist
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN add article is called
        response = await client.post(
            "/magazines/nonexistent/articles/article-id",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN 404 is returned
    assert response.status_code == status.HTTP_404_NOT_FOUND


@patch("app.routes.magazines.crud_article")
@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_add_article_article_not_found(
    mock_verify,
    mock_get_user,
    mock_magazine_crud,
    mock_article_crud,
    app,
    test_user,
    test_magazine,
):
    # GIVEN article doesn't exist
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=test_magazine)
    mock_article_crud.get_article_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN add article is called
        response = await client.post(
            f"/magazines/{test_magazine['id']}/articles/nonexistent",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN 404 is returned
    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# DELETE /magazines/{magazine_id}/articles/{article_id} Tests
# ============================================================================


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_remove_article_from_magazine(
    mock_verify,
    mock_get_user,
    mock_magazine_crud,
    app,
    test_user,
    test_magazine,
    test_article,
):
    # GIVEN user owns magazine
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=test_magazine)
    mock_magazine_crud.remove_article_from_magazine = AsyncMock()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN remove article is called
        response = await client.delete(
            f"/magazines/{test_magazine['id']}/articles/{test_article['id']}",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN article is removed
    assert response.status_code == status.HTTP_200_OK
    mock_magazine_crud.remove_article_from_magazine.assert_awaited_once()


# ============================================================================
# GET /magazines/{magazine_id}/articles Tests
# ============================================================================


@patch("app.routes.magazines.enrich_articles")
@patch("app.routes.magazines.crud_article")
@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_magazine_articles(
    mock_verify,
    mock_get_user,
    mock_magazine_crud,
    mock_article_crud,
    mock_enrich,
    app,
    test_user,
    test_magazine_with_articles,
    test_article,
):
    # GIVEN magazine has articles
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(
        return_value=test_magazine_with_articles
    )
    mock_article_crud.get_articles_by_ids = AsyncMock(return_value=[test_article])
    mock_enrich.return_value = [test_article]

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get articles is called
        response = await client.get(
            f"/magazines/{test_magazine_with_articles['id']}/articles",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN articles are returned
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1


# ============================================================================
# POST /magazines/{magazine_id}/follow Tests
# ============================================================================


@patch("app.routes.magazines.crud_user")
@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_follow_magazine(
    mock_verify,
    mock_get_user,
    mock_magazine_crud,
    mock_user_crud,
    app,
    test_user,
    test_user_2,
    test_magazine,
):
    # GIVEN user wants to follow someone else's magazine
    other_user_magazine = {**test_magazine, "user_id": test_user_2["id"]}
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=other_user_magazine)
    mock_user_crud.follow_magazine = AsyncMock()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN follow magazine is called
        response = await client.post(
            f"/magazines/{other_user_magazine['id']}/follow",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN magazine is followed
    assert response.status_code == status.HTTP_200_OK
    mock_user_crud.follow_magazine.assert_awaited_once()


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_follow_own_magazine(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user, test_magazine
):
    # GIVEN user tries to follow their own magazine
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=test_magazine)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN follow magazine is called
        response = await client.post(
            f"/magazines/{test_magazine['id']}/follow",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN error is returned
    assert response.status_code == status.HTTP_400_BAD_REQUEST


# ============================================================================
# GET /magazines/explore Tests
# ============================================================================


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_explore_magazines(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user, test_user_2
):
    # GIVEN authenticated user and magazines from other users exist
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    other_user_magazine = {
        "id": "other-magazine-id",
        "name": "Other User Magazine",
        "description": "A magazine from another user",
        "user_id": test_user_2["id"],
        "article_ids": [],
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
    }
    mock_magazine_crud.get_all_magazines = AsyncMock(return_value=[other_user_magazine])
    mock_magazine_crud.enrich_magazines_with_covers = AsyncMock(
        return_value=[other_user_magazine]
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get explore magazines is called
        response = await client.get(
            "/magazines/explore", headers={"Authorization": "Bearer valid-token"}
        )

    # THEN magazines are returned
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1
    # THEN get_all_magazines was called with correct exclude_user_id
    mock_magazine_crud.get_all_magazines.assert_awaited_once_with(
        skip=0, limit=100, exclude_user_id=test_user["id"]
    )


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_explore_magazines_excludes_current_user(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user, test_user_2
):
    # GIVEN authenticated user with magazines
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    # GIVEN other user's magazines are returned (user's own excluded)
    other_user_magazine = {
        "id": "other-magazine-id",
        "name": "Other User Magazine",
        "user_id": test_user_2["id"],
        "article_ids": [],
        "created_at": datetime(2024, 1, 5, 0, 0, 0),
        "updated_at": datetime(2024, 1, 5, 0, 0, 0),
    }
    mock_magazine_crud.get_all_magazines = AsyncMock(return_value=[other_user_magazine])
    mock_magazine_crud.enrich_magazines_with_covers = AsyncMock(
        return_value=[other_user_magazine]
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get explore magazines is called
        response = await client.get(
            "/magazines/explore", headers={"Authorization": "Bearer valid-token"}
        )

    # THEN only other users' magazines are returned
    assert response.status_code == status.HTTP_200_OK
    magazines = response.json()
    # Verify no magazine belongs to current user
    for magazine in magazines:
        assert magazine["user_id"] != test_user["id"]
    # THEN get_all_magazines was called with exclude_user_id
    mock_magazine_crud.get_all_magazines.assert_awaited_once_with(
        skip=0, limit=100, exclude_user_id=test_user["id"]
    )


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_explore_magazines_with_pagination(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user
):
    # GIVEN authenticated user
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_all_magazines = AsyncMock(return_value=[])
    mock_magazine_crud.enrich_magazines_with_covers = AsyncMock(return_value=[])

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get explore magazines is called with pagination params
        response = await client.get(
            "/magazines/explore?skip=10&limit=20",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN pagination params are passed to crud function
    assert response.status_code == status.HTTP_200_OK
    mock_magazine_crud.get_all_magazines.assert_awaited_once_with(
        skip=10, limit=20, exclude_user_id=test_user["id"]
    )


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_explore_magazines_empty_results(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user
):
    # GIVEN no magazines available to explore
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_all_magazines = AsyncMock(return_value=[])
    mock_magazine_crud.enrich_magazines_with_covers = AsyncMock(return_value=[])

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get explore magazines is called
        response = await client.get(
            "/magazines/explore", headers={"Authorization": "Bearer valid-token"}
        )

    # THEN empty list is returned
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


async def test_get_explore_magazines_unauthorized(app):
    # GIVEN no auth token
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get explore magazines is called
        response = await client.get("/magazines/explore")

    # THEN unauthorized is returned
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# GET /magazines/user/{user_id} Tests
# ============================================================================


@patch("app.routes.magazines.crud_magazine")
async def test_get_magazines_by_user(mock_magazine_crud, app, test_user, test_magazine):
    # GIVEN user has magazines
    mock_magazine_crud.get_user_magazines = AsyncMock(return_value=[test_magazine])
    mock_magazine_crud.enrich_magazines_with_covers = AsyncMock(
        return_value=[test_magazine]
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get magazines by user is called
        response = await client.get(f"/magazines/user/{test_user['id']}")

    # THEN magazines are returned
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1


# ============================================================================
# GET /magazines/{magazine_id}/comments Tests
# ============================================================================


@patch("app.routes.magazines.crud_comment")
@patch("app.routes.magazines.crud_magazine")
async def test_get_magazine_comments(
    mock_magazine_crud, mock_comment_crud, app, test_user, test_magazine
):
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=test_magazine)
    comment = {
        "id": "c1",
        "magazine_id": test_magazine["id"],
        "user_id": test_user["id"],
        "content": "Great magazine",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": None,
        "user": {
            "id": test_user["id"],
            "username": test_user["username"],
            "profile_pic": test_user["profile_pic"],
        },
    }
    mock_comment_crud.get_comments_by_magazine = AsyncMock(return_value=[comment])

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(f"/magazines/{test_magazine['id']}/comments")

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1


@patch("app.routes.magazines.crud_magazine")
async def test_get_magazine_comments_not_found(mock_magazine_crud, app):
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/magazines/nonexistent/comments")

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# POST /magazines/{magazine_id}/comments Tests
# ============================================================================


@patch("app.routes.magazines.crud_comment")
@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_create_magazine_comment(
    mock_verify,
    mock_get_user,
    mock_magazine_crud,
    mock_comment_crud,
    app,
    test_user,
    test_magazine,
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=test_magazine)
    comment_result = {
        "id": "new-comment",
        "magazine_id": test_magazine["id"],
        "user_id": test_user["id"],
        "content": "Nice magazine",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": None,
        "user": {
            "id": test_user["id"],
            "username": test_user["username"],
            "profile_pic": test_user["profile_pic"],
        },
    }
    mock_comment_crud.create_magazine_comment = AsyncMock(return_value=comment_result)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            f"/magazines/{test_magazine['id']}/comments",
            json={"content": "Nice magazine"},
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_201_CREATED


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_create_magazine_comment_not_found(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/magazines/nonexistent/comments",
            json={"content": "Comment"},
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# POST /magazines/{magazine_id}/unfollow Tests
# ============================================================================


@patch("app.routes.magazines.crud_user")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_unfollow_magazine(
    mock_verify, mock_get_user, mock_user_crud, app, test_user, test_magazine
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_user_crud.unfollow_magazine = AsyncMock()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            f"/magazines/{test_magazine['id']}/unfollow",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK
    mock_user_crud.unfollow_magazine.assert_awaited_once()


# ============================================================================
# Follow magazine not found Tests
# ============================================================================


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_follow_magazine_not_found(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/magazines/nonexistent/follow",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# GET /magazines/{magazine_id}/articles - empty Tests
# ============================================================================


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_magazine_articles_empty(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user, test_magazine
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=test_magazine)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            f"/magazines/{test_magazine['id']}/articles",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_magazine_articles_not_found(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/magazines/nonexistent/articles",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# GET /magazines/followed/me Tests
# ============================================================================


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_followed_magazines(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user, test_magazine
):
    user = {**test_user, "followed_magazines": [test_magazine["id"]]}
    mock_verify.return_value = {"sub": user["id"]}
    mock_get_user.return_value = user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=test_magazine)
    mock_magazine_crud.enrich_magazines_with_covers = AsyncMock(
        return_value=[test_magazine]
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/magazines/followed/me",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1


@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_followed_magazines_empty(mock_verify, mock_get_user, app, test_user):
    user = {**test_user, "followed_magazines": []}
    mock_verify.return_value = {"sub": user["id"]}
    mock_get_user.return_value = user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/magazines/followed/me",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


# ============================================================================
# Auth checks for article operations
# ============================================================================


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_remove_article_not_owner(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user, test_magazine
):
    different_user = {**test_user, "id": "different-id"}
    mock_verify.return_value = {"sub": different_user["id"]}
    mock_get_user.return_value = different_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=test_magazine)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.delete(
            f"/magazines/{test_magazine['id']}/articles/some-article",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_add_article_not_owner(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user, test_magazine
):
    different_user = {**test_user, "id": "different-id"}
    mock_verify.return_value = {"sub": different_user["id"]}
    mock_get_user.return_value = different_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=test_magazine)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            f"/magazines/{test_magazine['id']}/articles/some-article",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@patch("app.routes.magazines.crud_magazine")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_remove_article_magazine_not_found(
    mock_verify, mock_get_user, mock_magazine_crud, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_magazine_crud.get_magazine_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.delete(
            "/magazines/nonexistent/articles/some-article",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_404_NOT_FOUND
