from unittest.mock import AsyncMock, patch

import pytest

from app.utils.article_enricher import enrich_article, enrich_articles

pytestmark = pytest.mark.anyio


# ============================================================================
# enrich_article Tests
# ============================================================================


@patch("app.utils.article_enricher.interaction_crud")
async def test_enrich_article_no_user(mock_interaction_crud):
    article = {"id": "a1", "title": "Test"}

    result = await enrich_article(article, None)

    assert result == article
    mock_interaction_crud.get_interaction.assert_not_called()


@patch("app.utils.article_enricher.interaction_crud")
async def test_enrich_article_with_interaction(mock_interaction_crud):
    article = {"id": "a1", "title": "Test"}
    user = {"id": "u1"}
    mock_interaction_crud.get_interaction = AsyncMock(
        return_value={"is_liked": True, "is_saved": False}
    )

    result = await enrich_article(article, user)

    assert result["liked"] is True
    assert result["saved"] is False
    mock_interaction_crud.get_interaction.assert_awaited_once_with("u1", "a1")


@patch("app.utils.article_enricher.interaction_crud")
async def test_enrich_article_no_interaction(mock_interaction_crud):
    article = {"id": "a1", "title": "Test"}
    user = {"id": "u1"}
    mock_interaction_crud.get_interaction = AsyncMock(return_value=None)

    result = await enrich_article(article, user)

    assert "liked" not in result
    assert "saved" not in result


# ============================================================================
# enrich_articles Tests
# ============================================================================


@patch("app.utils.article_enricher.interaction_crud")
async def test_enrich_articles_no_user(mock_interaction_crud):
    articles = [{"id": "a1"}, {"id": "a2"}]

    result = await enrich_articles(articles, None)

    assert result == articles
    mock_interaction_crud.get_user_interactions_for_articles.assert_not_called()


@patch("app.utils.article_enricher.interaction_crud")
async def test_enrich_articles_with_interactions(mock_interaction_crud):
    articles = [{"id": "a1"}, {"id": "a2"}]
    user = {"id": "u1"}
    mock_interaction_crud.get_user_interactions_for_articles = AsyncMock(
        return_value={
            "a1": {"is_liked": True, "is_saved": False},
            "a2": {"is_liked": False, "is_saved": True},
        }
    )

    result = await enrich_articles(articles, user)

    assert result[0]["liked"] is True
    assert result[0]["saved"] is False
    assert result[1]["liked"] is False
    assert result[1]["saved"] is True


@patch("app.utils.article_enricher.interaction_crud")
async def test_enrich_articles_empty_interactions(mock_interaction_crud):
    articles = [{"id": "a1"}]
    user = {"id": "u1"}
    mock_interaction_crud.get_user_interactions_for_articles = AsyncMock(
        return_value={}
    )

    result = await enrich_articles(articles, user)

    assert result[0]["liked"] is False
    assert result[0]["saved"] is False
