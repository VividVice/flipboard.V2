from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.crud import article as article_crud
from app.schemas.article import ArticleCreate, ArticleUpdate

pytestmark = pytest.mark.anyio


# ============================================================================
# get_article_by_id Tests
# ============================================================================


@patch("app.crud.article.db")
async def test_get_article_by_id_found(mock_db, test_article):
    # GIVEN an article exists in the database
    mock_db.articles = MagicMock()
    mock_db.articles.find_one = AsyncMock(return_value=test_article)
    mock_db.articles.update_one = AsyncMock()

    # WHEN get_article_by_id is called
    result = await article_crud.get_article_by_id("test-article-id-123")

    # THEN the article is returned
    mock_db.articles.find_one.assert_awaited_with({"id": "test-article-id-123"})
    assert result == test_article


@patch("app.crud.article.db")
async def test_get_article_by_id_not_found(mock_db):
    # GIVEN no article exists
    mock_db.articles = MagicMock()
    mock_db.articles.find_one = AsyncMock(return_value=None)

    # WHEN get_article_by_id is called
    result = await article_crud.get_article_by_id("nonexistent-id")

    # THEN None is returned
    assert result is None


@patch("app.crud.article.db")
async def test_get_article_by_id_increments_view(mock_db, test_article):
    # GIVEN an article exists
    mock_db.articles = MagicMock()
    mock_db.articles.find_one = AsyncMock(return_value=test_article)
    mock_db.articles.update_one = AsyncMock()

    # WHEN get_article_by_id is called with increment_view=True
    await article_crud.get_article_by_id("test-article-id-123", increment_view=True)

    # THEN view_count is incremented
    mock_db.articles.update_one.assert_awaited_with(
        {"id": "test-article-id-123"}, {"$inc": {"view_count": 1}}
    )


# ============================================================================
# get_articles Tests
# ============================================================================


@patch("app.crud.article.db")
async def test_get_articles_basic(mock_db, test_article, test_article_2):
    # GIVEN articles exist in the database
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[test_article, test_article_2])
    mock_db.articles = MagicMock()
    mock_db.articles.find = MagicMock(return_value=mock_cursor)

    # WHEN get_articles is called
    result = await article_crud.get_articles(skip=0, limit=20)

    # THEN articles are returned
    assert len(result) == 2
    mock_db.articles.find.assert_called_with({})
    mock_cursor.sort.assert_called_with("published_at", -1)


@patch("app.crud.article.db")
async def test_get_articles_with_topic_filter(mock_db, test_article):
    # GIVEN articles with specific topic exist
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[test_article])
    mock_db.articles = MagicMock()
    mock_db.articles.find = MagicMock(return_value=mock_cursor)

    # WHEN get_articles is called with topic filter
    result = await article_crud.get_articles(topic="technology")

    # THEN query includes topic filter
    mock_db.articles.find.assert_called_with({"topics": "technology"})
    assert len(result) == 1


@patch("app.crud.article.db")
async def test_get_articles_with_search(mock_db, test_article):
    # GIVEN articles exist
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[test_article])
    mock_db.articles = MagicMock()
    mock_db.articles.find = MagicMock(return_value=mock_cursor)

    # WHEN get_articles is called with search term
    await article_crud.get_articles(search="test")

    # THEN query includes search regex
    call_args = mock_db.articles.find.call_args[0][0]
    assert "$or" in call_args
    assert call_args["$or"][0]["title"]["$regex"] == "test"


# ============================================================================
# get_articles_count Tests
# ============================================================================


@patch("app.crud.article.db")
async def test_get_articles_count_basic(mock_db):
    # GIVEN a count of articles
    mock_db.articles = MagicMock()
    mock_db.articles.count_documents = AsyncMock(return_value=42)

    # WHEN get_articles_count is called
    result = await article_crud.get_articles_count()

    # THEN count is returned
    assert result == 42
    mock_db.articles.count_documents.assert_awaited_with({})


@patch("app.crud.article.db")
async def test_get_articles_count_with_filters(mock_db):
    # GIVEN filtered count
    mock_db.articles = MagicMock()
    mock_db.articles.count_documents = AsyncMock(return_value=10)

    # WHEN get_articles_count is called with filters
    result = await article_crud.get_articles_count(topic="technology", search="test")

    # THEN count reflects filters
    assert result == 10
    call_args = mock_db.articles.count_documents.call_args[0][0]
    assert call_args["topics"] == "technology"
    assert "$or" in call_args


# ============================================================================
# get_hero_article Tests
# ============================================================================


@patch("app.crud.article.db")
async def test_get_hero_article_found(mock_db, test_article):
    # GIVEN articles exist
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[test_article])
    mock_db.articles = MagicMock()
    mock_db.articles.find = MagicMock(return_value=mock_cursor)

    # WHEN get_hero_article is called
    result = await article_crud.get_hero_article()

    # THEN the top article is returned
    assert result == test_article
    mock_cursor.sort.assert_called_with("view_count", -1)


@patch("app.crud.article.db")
async def test_get_hero_article_none(mock_db):
    # GIVEN no articles exist
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_db.articles = MagicMock()
    mock_db.articles.find = MagicMock(return_value=mock_cursor)

    # WHEN get_hero_article is called
    result = await article_crud.get_hero_article()

    # THEN None is returned
    assert result is None


# ============================================================================
# create_article Tests
# ============================================================================


@patch("app.crud.article.db")
async def test_create_article(mock_db):
    # GIVEN article data
    article_in = ArticleCreate(
        title="New Article",
        excerpt="Article excerpt",
        content="Article content",
        author="Author",
        publisher="Publisher",
        source_url="https://example.com/new",
        published_at=datetime(2024, 1, 20, 12, 0, 0),
    )
    created_article = {
        "id": "new-article-id",
        "title": "New Article",
        "view_count": 0,
        "like_count": 0,
        "comment_count": 0,
    }
    mock_db.articles = MagicMock()
    mock_db.articles.insert_one = AsyncMock()
    mock_db.articles.find_one = AsyncMock(return_value=created_article)
    mock_db.articles.update_one = AsyncMock()

    # WHEN create_article is called
    result = await article_crud.create_article(article_in)

    # THEN article is created with defaults
    mock_db.articles.insert_one.assert_awaited_once()
    insert_data = mock_db.articles.insert_one.call_args[0][0]
    assert insert_data["title"] == "New Article"
    assert insert_data["view_count"] == 0
    assert insert_data["like_count"] == 0
    assert insert_data["comment_count"] == 0
    assert "id" in insert_data
    assert "created_at" in insert_data
    assert result == created_article


# ============================================================================
# update_article Tests
# ============================================================================


@patch("app.crud.article.db")
async def test_update_article(mock_db, test_article):
    # GIVEN an article to update
    update_data = ArticleUpdate(title="Updated Title", excerpt="Updated excerpt")
    updated_article = {**test_article, "title": "Updated Title"}
    mock_db.articles = MagicMock()
    mock_db.articles.update_one = AsyncMock()
    mock_db.articles.find_one = AsyncMock(return_value=updated_article)

    # WHEN update_article is called
    result = await article_crud.update_article("test-article-id-123", update_data)

    # THEN article is updated
    mock_db.articles.update_one.assert_awaited_once()
    call_args = mock_db.articles.update_one.call_args
    assert call_args[0][0] == {"id": "test-article-id-123"}
    assert result["title"] == "Updated Title"


@patch("app.crud.article.db")
async def test_update_article_filters_none(mock_db, test_article):
    # GIVEN update with None values
    update_data = ArticleUpdate(title="Updated Title", excerpt=None)
    mock_db.articles = MagicMock()
    mock_db.articles.update_one = AsyncMock()
    mock_db.articles.find_one = AsyncMock(return_value=test_article)

    # WHEN update_article is called
    await article_crud.update_article("test-article-id-123", update_data)

    # THEN None values are filtered out
    call_args = mock_db.articles.update_one.call_args
    update_set = call_args[0][1]["$set"]
    assert "title" in update_set
    assert "excerpt" not in update_set or update_set.get("excerpt") is not None


# ============================================================================
# delete_article Tests
# ============================================================================


@patch("app.crud.article.db")
async def test_delete_article_success(mock_db):
    # GIVEN an article exists
    mock_result = MagicMock()
    mock_result.deleted_count = 1
    mock_db.articles = MagicMock()
    mock_db.articles.delete_one = AsyncMock(return_value=mock_result)

    # WHEN delete_article is called
    result = await article_crud.delete_article("test-article-id-123")

    # THEN True is returned
    assert result is True
    mock_db.articles.delete_one.assert_awaited_with({"id": "test-article-id-123"})


@patch("app.crud.article.db")
async def test_delete_article_not_found(mock_db):
    # GIVEN no article exists
    mock_result = MagicMock()
    mock_result.deleted_count = 0
    mock_db.articles = MagicMock()
    mock_db.articles.delete_one = AsyncMock(return_value=mock_result)

    # WHEN delete_article is called
    result = await article_crud.delete_article("nonexistent-id")

    # THEN False is returned
    assert result is False


# ============================================================================
# increment_like_count Tests
# ============================================================================


@patch("app.crud.article.db")
async def test_increment_like_count(mock_db):
    # GIVEN an article
    mock_db.articles = MagicMock()
    mock_db.articles.update_one = AsyncMock()

    # WHEN increment_like_count is called
    await article_crud.increment_like_count("test-article-id-123", increment=1)

    # THEN like_count is incremented
    mock_db.articles.update_one.assert_awaited_with(
        {"id": "test-article-id-123"}, {"$inc": {"like_count": 1}}
    )


@patch("app.crud.article.db")
async def test_decrement_like_count(mock_db):
    # GIVEN an article
    mock_db.articles = MagicMock()
    mock_db.articles.update_one = AsyncMock()

    # WHEN increment_like_count is called with negative increment
    await article_crud.increment_like_count("test-article-id-123", increment=-1)

    # THEN like_count is decremented
    mock_db.articles.update_one.assert_awaited_with(
        {"id": "test-article-id-123"}, {"$inc": {"like_count": -1}}
    )


# ============================================================================
# increment_comment_count Tests
# ============================================================================


@patch("app.crud.article.db")
async def test_increment_comment_count(mock_db):
    # GIVEN an article
    mock_db.articles = MagicMock()
    mock_db.articles.update_one = AsyncMock()

    # WHEN increment_comment_count is called
    await article_crud.increment_comment_count("test-article-id-123", increment=1)

    # THEN comment_count is incremented
    mock_db.articles.update_one.assert_awaited_with(
        {"id": "test-article-id-123"}, {"$inc": {"comment_count": 1}}
    )


# ============================================================================
# get_articles_by_topic_ids Tests
# ============================================================================


@patch("app.crud.article.db")
async def test_get_articles_by_topic_ids(mock_db, test_article):
    # GIVEN articles with topics
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[test_article])
    mock_db.articles = MagicMock()
    mock_db.articles.find = MagicMock(return_value=mock_cursor)

    # WHEN get_articles_by_topic_ids is called
    result = await article_crud.get_articles_by_topic_ids(
        ["topic-1", "topic-2"], skip=0, limit=20
    )

    # THEN articles with matching topics are returned
    call_args = mock_db.articles.find.call_args[0][0]
    assert call_args == {"topics": {"$in": ["topic-1", "topic-2"]}}
    assert len(result) == 1


# ============================================================================
# get_article_by_url Tests
# ============================================================================


@patch("app.crud.article.db")
async def test_get_article_by_url_found(mock_db, test_article):
    # GIVEN an article with source_url
    mock_db.articles = MagicMock()
    mock_db.articles.find_one = AsyncMock(return_value=test_article)

    # WHEN get_article_by_url is called
    result = await article_crud.get_article_by_url("https://example.com/article")

    # THEN the article is returned
    mock_db.articles.find_one.assert_awaited_with(
        {"source_url": "https://example.com/article"}
    )
    assert result == test_article


@patch("app.crud.article.db")
async def test_get_article_by_url_not_found(mock_db):
    # GIVEN no article with that URL
    mock_db.articles = MagicMock()
    mock_db.articles.find_one = AsyncMock(return_value=None)

    # WHEN get_article_by_url is called
    result = await article_crud.get_article_by_url("https://nonexistent.com")

    # THEN None is returned
    assert result is None


# ============================================================================
# get_articles_by_urls Tests
# ============================================================================


@patch("app.crud.article.db")
async def test_get_articles_by_urls(mock_db, test_article, test_article_2):
    # GIVEN articles with URLs
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[test_article, test_article_2])
    mock_db.articles = MagicMock()
    mock_db.articles.find = MagicMock(return_value=mock_cursor)

    # WHEN get_articles_by_urls is called
    urls = ["https://example.com/article", "https://example.com/article2"]
    result = await article_crud.get_articles_by_urls(urls)

    # THEN articles are returned
    call_args = mock_db.articles.find.call_args[0][0]
    assert call_args == {"source_url": {"$in": urls}}
    assert len(result) == 2


# ============================================================================
# get_articles_by_ids Tests
# ============================================================================


@patch("app.crud.article.db")
async def test_get_articles_by_ids(mock_db, test_article, test_article_2):
    # GIVEN articles with IDs
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[test_article, test_article_2])
    mock_db.articles = MagicMock()
    mock_db.articles.find = MagicMock(return_value=mock_cursor)

    # WHEN get_articles_by_ids is called
    ids = ["test-article-id-123", "test-article-id-456"]
    result = await article_crud.get_articles_by_ids(ids)

    # THEN articles are returned
    call_args = mock_db.articles.find.call_args[0][0]
    assert call_args == {"id": {"$in": ids}}
    assert len(result) == 2
