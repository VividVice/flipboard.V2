from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.news import NewsPost, NewsResponse
from app.utils.newsletter import process_weekly_newsletter

pytestmark = pytest.mark.anyio


# ============================================================================
# process_weekly_newsletter Tests
# ============================================================================


@patch("app.utils.newsletter.send_newsletter_email")
@patch("app.utils.newsletter.fetch_news_feed")
@patch("app.utils.newsletter.db")
async def test_process_newsletter_no_subscribers(mock_db, mock_fetch, mock_send):
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_db.users.find = MagicMock(return_value=mock_cursor)

    await process_weekly_newsletter()

    mock_fetch.assert_not_called()
    mock_send.assert_not_called()


@patch("app.utils.newsletter.send_newsletter_email")
@patch("app.utils.newsletter.fetch_news_feed")
@patch("app.utils.newsletter.db")
async def test_process_newsletter_user_no_topics(mock_db, mock_fetch, mock_send):
    user = {
        "id": "u1",
        "email": "test@example.com",
        "followed_topics": [],
    }
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[user])
    mock_db.users.find = MagicMock(return_value=mock_cursor)

    await process_weekly_newsletter()

    mock_fetch.assert_not_called()
    mock_send.assert_not_called()


@patch("app.utils.newsletter.send_newsletter_email")
@patch("app.utils.newsletter.fetch_news_feed")
@patch("app.utils.newsletter.db")
async def test_process_newsletter_topics_not_found(mock_db, mock_fetch, mock_send):
    user = {
        "id": "u1",
        "email": "test@example.com",
        "followed_topics": ["topic-1"],
    }
    mock_users_cursor = MagicMock()
    mock_users_cursor.to_list = AsyncMock(return_value=[user])
    mock_db.users.find = MagicMock(return_value=mock_users_cursor)

    mock_topics_cursor = MagicMock()
    mock_topics_cursor.to_list = AsyncMock(return_value=[])
    mock_db.topics.find = MagicMock(return_value=mock_topics_cursor)

    await process_weekly_newsletter()

    mock_fetch.assert_not_called()
    mock_send.assert_not_called()


@patch("app.utils.newsletter.send_newsletter_email")
@patch("app.utils.newsletter.fetch_news_feed")
@patch("app.utils.newsletter.db")
async def test_process_newsletter_success(mock_db, mock_fetch, mock_send):
    user = {
        "id": "u1",
        "email": "test@example.com",
        "followed_topics": ["topic-1"],
    }
    mock_users_cursor = MagicMock()
    mock_users_cursor.to_list = AsyncMock(return_value=[user])
    mock_db.users.find = MagicMock(return_value=mock_users_cursor)

    mock_topics_cursor = MagicMock()
    mock_topics_cursor.to_list = AsyncMock(
        return_value=[{"id": "topic-1", "name": "Technology"}]
    )
    mock_db.topics.find = MagicMock(return_value=mock_topics_cursor)

    news_post = NewsPost(uuid="p1", title="News", url="http://test.com", text="Text")
    mock_fetch.return_value = NewsResponse(posts=[news_post])
    mock_send.return_value = True

    await process_weekly_newsletter()

    mock_fetch.assert_awaited_once_with(topics=["Technology"], size=5)
    mock_send.assert_awaited_once_with("test@example.com", [news_post])


@patch("app.utils.newsletter.send_newsletter_email")
@patch("app.utils.newsletter.fetch_news_feed")
@patch("app.utils.newsletter.db")
async def test_process_newsletter_no_news(mock_db, mock_fetch, mock_send):
    user = {
        "id": "u1",
        "email": "test@example.com",
        "followed_topics": ["topic-1"],
    }
    mock_users_cursor = MagicMock()
    mock_users_cursor.to_list = AsyncMock(return_value=[user])
    mock_db.users.find = MagicMock(return_value=mock_users_cursor)

    mock_topics_cursor = MagicMock()
    mock_topics_cursor.to_list = AsyncMock(
        return_value=[{"id": "topic-1", "name": "Technology"}]
    )
    mock_db.topics.find = MagicMock(return_value=mock_topics_cursor)

    mock_fetch.return_value = NewsResponse(posts=[])

    await process_weekly_newsletter()

    mock_send.assert_not_called()


@patch("app.utils.newsletter.send_newsletter_email")
@patch("app.utils.newsletter.fetch_news_feed")
@patch("app.utils.newsletter.db")
async def test_process_newsletter_error_handling(mock_db, mock_fetch, mock_send):
    user = {
        "id": "u1",
        "email": "test@example.com",
        "followed_topics": ["topic-1"],
    }
    mock_users_cursor = MagicMock()
    mock_users_cursor.to_list = AsyncMock(return_value=[user])
    mock_db.users.find = MagicMock(return_value=mock_users_cursor)

    mock_topics_cursor = MagicMock()
    mock_topics_cursor.to_list = AsyncMock(
        return_value=[{"id": "topic-1", "name": "Technology"}]
    )
    mock_db.topics.find = MagicMock(return_value=mock_topics_cursor)

    mock_fetch.side_effect = Exception("API down")

    # Should not raise, error is caught internally
    await process_weekly_newsletter()


@patch("app.utils.newsletter.send_newsletter_email")
@patch("app.utils.newsletter.fetch_news_feed")
@patch("app.utils.newsletter.db")
async def test_process_newsletter_multiple_users(mock_db, mock_fetch, mock_send):
    users = [
        {"id": "u1", "email": "user1@example.com", "followed_topics": ["t1"]},
        {"id": "u2", "email": "user2@example.com", "followed_topics": ["t2"]},
    ]
    mock_users_cursor = MagicMock()
    mock_users_cursor.to_list = AsyncMock(return_value=users)
    mock_db.users.find = MagicMock(return_value=mock_users_cursor)

    mock_topics_cursor = MagicMock()
    mock_topics_cursor.to_list = AsyncMock(
        side_effect=[
            [{"id": "t1", "name": "Tech"}],
            [{"id": "t2", "name": "Sports"}],
        ]
    )
    mock_db.topics.find = MagicMock(return_value=mock_topics_cursor)

    news_post = NewsPost(uuid="p1", title="News", url="http://test.com", text="Text")
    mock_fetch.return_value = NewsResponse(posts=[news_post])
    mock_send.return_value = True

    await process_weekly_newsletter()

    assert mock_send.await_count == 2
