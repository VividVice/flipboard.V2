from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException, status
from httpx import ASGITransport, AsyncClient

from app.models.news import NewsPost, NewsResponse

pytestmark = pytest.mark.anyio


@pytest.fixture
def app():
    from app.main import app

    return app


def _empty_response():
    return NewsResponse(posts=[], totalResults=0, requestsLeft=99)


def _response_with_posts():
    return NewsResponse(
        posts=[NewsPost(uuid="p1", title="Test", url="http://test.com", text="Text")],
        totalResults=1,
        requestsLeft=98,
    )


# ============================================================================
# GET /news/ Tests
# ============================================================================


@patch("app.routes.news.enrich_news_response")
@patch("app.routes.news.news_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_news(
    mock_verify, mock_get_user, mock_news_crud, mock_enrich, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    resp = _response_with_posts()
    mock_news_crud.fetch_news = AsyncMock(return_value=resp)
    mock_enrich.return_value = resp

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/news/?q=bitcoin", headers={"Authorization": "Bearer valid-token"}
        )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["posts"]) == 1


async def test_get_news_unauthorized(app):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/news/")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================================
# GET /news/feed Tests
# ============================================================================


@patch("app.routes.news.enrich_news_response")
@patch("app.routes.news.topic_crud")
@patch("app.routes.news.news_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_news_feed_with_topics(
    mock_verify,
    mock_get_user,
    mock_news_crud,
    mock_topic_crud,
    mock_enrich,
    app,
    test_user,
):
    user = {**test_user, "followed_topics": ["topic-1"]}
    mock_verify.return_value = {"sub": user["id"]}
    mock_get_user.return_value = user
    mock_topic_crud.get_topics_by_ids = AsyncMock(
        return_value=[{"id": "topic-1", "name": "Technology"}]
    )
    resp = _response_with_posts()
    mock_news_crud.fetch_news_feed = AsyncMock(return_value=resp)
    mock_enrich.return_value = resp

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/news/feed", headers={"Authorization": "Bearer valid-token"}
        )

    assert response.status_code == status.HTTP_200_OK
    mock_news_crud.fetch_news_feed.assert_awaited_once()


@patch("app.routes.news.enrich_news_response")
@patch("app.routes.news.news_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_news_feed_no_topics(
    mock_verify, mock_get_user, mock_news_crud, mock_enrich, app, test_user
):
    user = {**test_user, "followed_topics": []}
    mock_verify.return_value = {"sub": user["id"]}
    mock_get_user.return_value = user
    resp = _empty_response()
    mock_news_crud.fetch_news = AsyncMock(return_value=resp)
    mock_enrich.return_value = resp

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/news/feed", headers={"Authorization": "Bearer valid-token"}
        )

    assert response.status_code == status.HTTP_200_OK
    mock_news_crud.fetch_news.assert_awaited_once()


@patch("app.routes.news.enrich_news_response")
@patch("app.routes.news.topic_crud")
@patch("app.routes.news.news_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_news_feed_no_valid_topic_names(
    mock_verify,
    mock_get_user,
    mock_news_crud,
    mock_topic_crud,
    mock_enrich,
    app,
    test_user,
):
    user = {**test_user, "followed_topics": ["deleted-topic"]}
    mock_verify.return_value = {"sub": user["id"]}
    mock_get_user.return_value = user
    mock_topic_crud.get_topics_by_ids = AsyncMock(return_value=[])
    resp = _empty_response()
    mock_news_crud.fetch_news = AsyncMock(return_value=resp)
    mock_enrich.return_value = resp

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/news/feed", headers={"Authorization": "Bearer valid-token"}
        )

    assert response.status_code == status.HTTP_200_OK
    mock_news_crud.fetch_news.assert_awaited_once()


@patch("app.routes.news.news_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_news_feed_invalid_sentiment(
    mock_verify, mock_get_user, mock_news_crud, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/news/feed?sentiment=invalid",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@patch("app.routes.news.topic_crud")
@patch("app.routes.news.news_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_news_feed_internal_error(
    mock_verify, mock_get_user, mock_news_crud, mock_topic_crud, app, test_user
):
    user = {**test_user, "followed_topics": ["t1"]}
    mock_verify.return_value = {"sub": user["id"]}
    mock_get_user.return_value = user
    mock_topic_crud.get_topics_by_ids = AsyncMock(side_effect=RuntimeError("DB down"))

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/news/feed", headers={"Authorization": "Bearer valid-token"}
        )

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


@patch("app.routes.news.topic_crud")
@patch("app.routes.news.news_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_news_feed_reraises_http_exception(
    mock_verify, mock_get_user, mock_news_crud, mock_topic_crud, app, test_user
):
    # GIVEN an HTTPException is raised inside the try block
    user = {**test_user, "followed_topics": ["t1"]}
    mock_verify.return_value = {"sub": user["id"]}
    mock_get_user.return_value = user
    mock_topic_crud.get_topics_by_ids = AsyncMock(
        return_value=[{"id": "t1", "name": "sports"}]
    )
    mock_news_crud.fetch_news_feed = AsyncMock(
        side_effect=HTTPException(status_code=429, detail="Rate limited")
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/news/feed", headers={"Authorization": "Bearer valid-token"}
        )

    # THEN the HTTPException is re-raised (not wrapped in 500)
    assert response.status_code == 429


# ============================================================================
# GET /news/topic/{topic} Tests
# ============================================================================


@patch("app.routes.news.enrich_news_response")
@patch("app.routes.news.news_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_news_by_topic(
    mock_verify, mock_get_user, mock_news_crud, mock_enrich, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    resp = _response_with_posts()
    mock_news_crud.fetch_news_by_topic = AsyncMock(return_value=resp)
    mock_enrich.return_value = resp

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/news/topic/technology",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK


@patch("app.routes.news.news_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_news_by_topic_invalid_sentiment(
    mock_verify, mock_get_user, mock_news_crud, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/news/topic/technology?sentiment=bad",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


# ============================================================================
# GET /news/content Tests
# ============================================================================


@patch("app.routes.news.scrape_article_content")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_article_content(
    mock_verify, mock_get_user, mock_scrape, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_scrape.return_value = "<article>Content</article>"

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/news/content?url=http://example.com/article",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["content"] == "<article>Content</article>"


@patch("app.routes.news.scrape_article_content")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_article_content_error(
    mock_verify, mock_get_user, mock_scrape, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_scrape.side_effect = Exception("Scrape failed")

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/news/content?url=http://example.com/bad",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


# ============================================================================
# GET /news/next Tests
# ============================================================================


@patch("app.routes.news.enrich_news_response")
@patch("app.routes.news.news_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_next_news_page(
    mock_verify, mock_get_user, mock_news_crud, mock_enrich, app, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    resp = _response_with_posts()
    mock_news_crud.fetch_news_paginated = AsyncMock(return_value=resp)
    mock_enrich.return_value = resp

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get(
            "/news/next?next_url=/newsApiLite?next=abc",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == status.HTTP_200_OK


# ============================================================================
# enrich_news_response Tests
# ============================================================================


@patch("app.routes.news.interaction_crud")
@patch("app.routes.news.article_crud")
async def test_enrich_news_response_no_user(mock_article_crud, mock_interaction_crud):
    from app.routes.news import enrich_news_response

    response = _response_with_posts()
    result = await enrich_news_response(response, None)
    assert result == response
    mock_article_crud.get_articles_by_urls.assert_not_called()


@patch("app.routes.news.interaction_crud")
@patch("app.routes.news.article_crud")
async def test_enrich_news_response_no_posts(mock_article_crud, mock_interaction_crud):
    from app.routes.news import enrich_news_response

    response = _empty_response()
    result = await enrich_news_response(response, {"id": "u1"})
    assert result == response
    mock_article_crud.get_articles_by_urls.assert_not_called()


@patch("app.routes.news.interaction_crud")
@patch("app.routes.news.article_crud")
async def test_enrich_news_response_no_existing_articles(
    mock_article_crud, mock_interaction_crud
):
    from app.routes.news import enrich_news_response

    response = _response_with_posts()
    mock_article_crud.get_articles_by_urls = AsyncMock(return_value=[])

    result = await enrich_news_response(response, {"id": "u1"})
    assert result == response
    mock_interaction_crud.get_user_interactions_for_articles.assert_not_called()


@patch("app.routes.news.interaction_crud")
@patch("app.routes.news.article_crud")
async def test_enrich_news_response_with_interactions(
    mock_article_crud, mock_interaction_crud
):
    from app.routes.news import enrich_news_response

    response = _response_with_posts()
    mock_article_crud.get_articles_by_urls = AsyncMock(
        return_value=[{"id": "art-1", "source_url": "http://test.com"}]
    )
    mock_interaction_crud.get_user_interactions_for_articles = AsyncMock(
        return_value={"art-1": {"is_liked": True, "is_saved": False}}
    )

    result = await enrich_news_response(response, {"id": "u1"})
    assert result.posts[0].liked is True
    assert result.posts[0].saved is False
