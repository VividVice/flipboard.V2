from unittest.mock import AsyncMock, patch

import pytest

from app.routes.articles import import_article
from app.schemas.article import ArticleCreate

pytestmark = pytest.mark.anyio


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
