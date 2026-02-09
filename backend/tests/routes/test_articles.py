from unittest.mock import AsyncMock, patch

import pytest
from fastapi import status
from httpx import ASGITransport, AsyncClient

from app.routes.articles import import_article
from app.schemas.article import ArticleCreate

pytestmark = pytest.mark.anyio


@pytest.fixture
def app():
    from app.main import app

    return app


@patch("app.routes.articles.article_crud")
@patch("app.routes.articles.enrich_article")
async def test_import_article_updates_content(mock_enrich, mock_article_crud):
    # Setup
    existing_article = {
        "id": "123",
        "source_url": "http://test.com",
        "content": "Short snippet",
    }
    mock_article_crud.get_article_by_url = AsyncMock(return_value=existing_article)
    mock_article_crud.update_article = AsyncMock()

    # Setup enrich to just return the article
    mock_enrich.side_effect = lambda a, u: a

    # Input with long content
    long_content = "A" * 500
    article_in = ArticleCreate(
        title="Test",
        excerpt="Test",
        content=long_content,
        author="Test",
        publisher="Test",
        source_url="http://test.com",
        published_at="2023-01-01T00:00:00",
    )

    current_user = {"id": "user1"}

    # Execute
    await import_article(article_in, current_user)

    # Verify
    mock_article_crud.update_article.assert_called_once()
    call_args = mock_article_crud.update_article.call_args
    assert call_args[0][0] == "123"
    assert call_args[0][1].content == long_content


@patch("app.routes.articles.article_crud")
@patch("app.routes.articles.enrich_article")
async def test_import_article_does_not_update_if_short(mock_enrich, mock_article_crud):
    # Setup
    existing_article = {
        "id": "123",
        "source_url": "http://test.com",
        "content": "A" * 500,  # Existing is long
    }
    mock_article_crud.get_article_by_url = AsyncMock(return_value=existing_article)
    mock_article_crud.update_article = AsyncMock()
    mock_enrich.side_effect = lambda a, u: a

    # Input with short content
    short_content = "Short snippet"
    article_in = ArticleCreate(
        title="Test",
        excerpt="Test",
        content=short_content,
        author="Test",
        publisher="Test",
        source_url="http://test.com",
        published_at="2023-01-01T00:00:00",
    )

    current_user = {"id": "user1"}

    # Execute
    await import_article(article_in, current_user)

    # Verify
    mock_article_crud.update_article.assert_not_called()


# ============================================================================
# GET /articles/ Tests
# ============================================================================


@patch("app.routes.articles.enrich_articles")
@patch("app.routes.articles.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_articles(
    mock_verify, mock_get_user, mock_article_crud, mock_enrich, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_articles = AsyncMock(return_value=[])
    mock_article_crud.get_articles_count = AsyncMock(return_value=0)
    mock_enrich.return_value = []

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/articles/", headers={"Authorization": "Bearer valid-token"}
        )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["articles"] == []
    assert data["total"] == 0


# ============================================================================
# GET /articles/hero Tests
# ============================================================================


@patch("app.routes.articles.enrich_article")
@patch("app.routes.articles.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_hero_article(
    mock_verify,
    mock_get_user,
    mock_article_crud,
    mock_enrich,
    app,
    test_user,
    test_article,
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_hero_article = AsyncMock(return_value=test_article)
    mock_enrich.return_value = test_article

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/articles/hero", headers={"Authorization": "Bearer valid-token"}
        )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == test_article["id"]


@patch("app.routes.articles.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_hero_article_not_found(
    mock_verify, mock_get_user, mock_article_crud, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_hero_article = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/articles/hero", headers={"Authorization": "Bearer valid-token"}
        )

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# GET /articles/feed Tests
# ============================================================================


@patch("app.routes.articles.enrich_articles")
@patch("app.routes.articles.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_feed_with_topics(
    mock_verify,
    mock_get_user,
    mock_article_crud,
    mock_enrich,
    app,
    test_user,
    test_article,
):
    user = {**test_user, "followed_topics": ["topic-1"]}
    mock_verify.return_value = {"sub": user["id"]}
    mock_get_user.return_value = user
    mock_article_crud.get_articles_by_topic_ids = AsyncMock(return_value=[test_article])
    mock_enrich.return_value = [test_article]

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/articles/feed", headers={"Authorization": "Bearer valid-token"}
        )

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()["articles"]) == 1


@patch("app.routes.articles.enrich_articles")
@patch("app.routes.articles.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_feed_no_topics(
    mock_verify, mock_get_user, mock_article_crud, mock_enrich, app, test_user
):
    user = {**test_user, "followed_topics": []}
    mock_verify.return_value = {"sub": user["id"]}
    mock_get_user.return_value = user
    mock_article_crud.get_articles = AsyncMock(return_value=[])
    mock_article_crud.get_articles_count = AsyncMock(return_value=0)
    mock_enrich.return_value = []

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/articles/feed", headers={"Authorization": "Bearer valid-token"}
        )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["articles"] == []


# ============================================================================
# GET /articles/{article_id} Tests
# ============================================================================


@patch("app.routes.articles.enrich_article")
@patch("app.routes.articles.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_article_by_id(
    mock_verify,
    mock_get_user,
    mock_article_crud,
    mock_enrich,
    app,
    test_user,
    test_article,
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_article_by_id = AsyncMock(return_value=test_article)
    mock_enrich.return_value = test_article

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            f"/articles/{test_article['id']}",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == test_article["id"]
    mock_article_crud.get_article_by_id.assert_awaited_with(
        test_article["id"], increment_view=True
    )


@patch("app.routes.articles.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_article_not_found(
    mock_verify, mock_get_user, mock_article_crud, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_article_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/articles/nonexistent",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# POST /articles/ Tests
# ============================================================================


@patch("app.routes.articles.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_create_article(
    mock_verify, mock_get_user, mock_article_crud, app, test_user, test_article
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.create_article = AsyncMock(return_value=test_article)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/articles/",
            json={
                "title": "Test",
                "excerpt": "Exc",
                "content": "Content",
                "author": "Author",
                "publisher": "Publisher",
                "source_url": "http://test.com",
                "published_at": "2024-01-01T00:00:00",
            },
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_201_CREATED


# ============================================================================
# POST /articles/import Tests (new article)
# ============================================================================


@patch("app.routes.articles.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_import_article_new(
    mock_verify, mock_get_user, mock_article_crud, app, test_user, test_article
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_article_by_url = AsyncMock(return_value=None)
    mock_article_crud.create_article = AsyncMock(return_value=test_article)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/articles/import",
            json={
                "title": "New",
                "excerpt": "Exc",
                "content": "Content",
                "author": "Author",
                "publisher": "Pub",
                "source_url": "http://new.com",
                "published_at": "2024-01-01T00:00:00",
            },
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK
    mock_article_crud.create_article.assert_awaited_once()


# ============================================================================
# PUT /articles/{article_id} Tests
# ============================================================================


@patch("app.routes.articles.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_update_article(
    mock_verify, mock_get_user, mock_article_crud, app, test_user, test_article
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_article_by_id = AsyncMock(return_value=test_article)
    updated = {**test_article, "title": "Updated"}
    mock_article_crud.update_article = AsyncMock(return_value=updated)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.put(
            f"/articles/{test_article['id']}",
            json={"title": "Updated"},
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK


@patch("app.routes.articles.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_update_article_not_found(
    mock_verify, mock_get_user, mock_article_crud, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_article_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.put(
            "/articles/nonexistent",
            json={"title": "Updated"},
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# DELETE /articles/{article_id} Tests
# ============================================================================


@patch("app.routes.articles.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_delete_article(
    mock_verify, mock_get_user, mock_article_crud, app, test_user, test_article
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_article_by_id = AsyncMock(return_value=test_article)
    mock_article_crud.delete_article = AsyncMock(return_value=True)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.delete(
            f"/articles/{test_article['id']}",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_204_NO_CONTENT


@patch("app.routes.articles.article_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_delete_article_not_found(
    mock_verify, mock_get_user, mock_article_crud, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_article_crud.get_article_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.delete(
            "/articles/nonexistent",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_404_NOT_FOUND
