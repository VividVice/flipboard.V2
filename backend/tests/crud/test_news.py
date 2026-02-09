from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastapi import HTTPException

from app.crud import news as news_crud
from app.models.news import NewsResponse

pytestmark = pytest.mark.anyio


# ============================================================================
# fetch_news Tests
# ============================================================================


@patch("app.crud.news.httpx.AsyncClient")
async def test_fetch_news_basic(mock_client_class):
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "posts": [{"uuid": "p1", "title": "Test"}],
        "totalResults": 1,
        "moreResultsAvailable": 0,
        "requestsLeft": 99,
    }
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    result = await news_crud.fetch_news(query="bitcoin", size=5)

    assert isinstance(result, NewsResponse)
    assert len(result.posts) == 1
    assert result.totalResults == 1
    mock_client.get.assert_awaited_once()
    call_kwargs = mock_client.get.call_args
    assert call_kwargs[1]["params"]["q"] == "bitcoin"
    assert call_kwargs[1]["params"]["size"] == 5


@patch("app.crud.news.httpx.AsyncClient")
async def test_fetch_news_with_country(mock_client_class):
    mock_response = MagicMock()
    mock_response.json.return_value = {"posts": [], "totalResults": 0}
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    await news_crud.fetch_news(query="news", country="US")

    call_kwargs = mock_client.get.call_args
    assert "thread.country:US" in call_kwargs[1]["params"]["q"]


@patch("app.crud.news.httpx.AsyncClient")
async def test_fetch_news_with_timestamp(mock_client_class):
    mock_response = MagicMock()
    mock_response.json.return_value = {"posts": [], "totalResults": 0}
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    await news_crud.fetch_news(query="news", timestamp=1234567890)

    call_kwargs = mock_client.get.call_args
    assert call_kwargs[1]["params"]["ts"] == 1234567890


@patch("app.crud.news.httpx.AsyncClient")
async def test_fetch_news_size_capped_at_10(mock_client_class):
    mock_response = MagicMock()
    mock_response.json.return_value = {"posts": [], "totalResults": 0}
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    await news_crud.fetch_news(query="news", size=50)

    call_kwargs = mock_client.get.call_args
    assert call_kwargs[1]["params"]["size"] == 10


@patch("app.crud.news.httpx.AsyncClient")
async def test_fetch_news_query_truncated(mock_client_class):
    mock_response = MagicMock()
    mock_response.json.return_value = {"posts": [], "totalResults": 0}
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    long_query = "a" * 200
    await news_crud.fetch_news(query=long_query)

    call_kwargs = mock_client.get.call_args
    assert len(call_kwargs[1]["params"]["q"]) == 100


@patch("app.crud.news.httpx.AsyncClient")
async def test_fetch_news_http_error(mock_client_class):
    mock_response = MagicMock()
    mock_response.status_code = 429
    mock_response.text = "Rate limit exceeded"
    mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Rate limited",
        request=MagicMock(),
        response=mock_response,
    )

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    with pytest.raises(HTTPException) as exc_info:
        await news_crud.fetch_news(query="news")

    assert exc_info.value.status_code == 429


@patch("app.crud.news.httpx.AsyncClient")
async def test_fetch_news_generic_error(mock_client_class):
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(side_effect=RuntimeError("Connection failed"))
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    with pytest.raises(RuntimeError):
        await news_crud.fetch_news(query="news")


# ============================================================================
# fetch_news_feed Tests
# ============================================================================


@patch("app.crud.news.fetch_news")
async def test_fetch_news_feed_empty_topics(mock_fetch):
    mock_fetch.return_value = NewsResponse()

    await news_crud.fetch_news_feed(topics=[])

    mock_fetch.assert_awaited_once_with(
        query="news", timestamp=None, size=10, country=None
    )


@patch("app.crud.news.fetch_news")
async def test_fetch_news_feed_mapped_topics(mock_fetch):
    mock_fetch.return_value = NewsResponse()

    await news_crud.fetch_news_feed(topics=["technology", "sports"])

    call_args = mock_fetch.call_args
    query = call_args[1]["query"]
    assert "Science and Technology" in query
    assert "Sport" in query
    assert " OR " in query


@patch("app.crud.news.fetch_news")
async def test_fetch_news_feed_unmapped_topic(mock_fetch):
    mock_fetch.return_value = NewsResponse()

    await news_crud.fetch_news_feed(topics=["blockchain"])

    call_args = mock_fetch.call_args
    query = call_args[1]["query"]
    assert 'title:"blockchain"' in query


@patch("app.crud.news.fetch_news")
async def test_fetch_news_feed_with_sentiment(mock_fetch):
    mock_fetch.return_value = NewsResponse()

    await news_crud.fetch_news_feed(
        topics=["technology", "sports"], sentiment="positive"
    )

    call_args = mock_fetch.call_args
    query = call_args[1]["query"]
    assert "sentiment:positive" in query


@patch("app.crud.news.fetch_news")
async def test_fetch_news_feed_single_topic_with_sentiment(mock_fetch):
    mock_fetch.return_value = NewsResponse()

    await news_crud.fetch_news_feed(topics=["technology"], sentiment="negative")

    call_args = mock_fetch.call_args
    query = call_args[1]["query"]
    assert "sentiment:negative" in query
    assert "(" not in query


@patch("app.crud.news.fetch_news")
async def test_fetch_news_feed_skips_invalid_topics(mock_fetch):
    mock_fetch.return_value = NewsResponse()

    await news_crud.fetch_news_feed(topics=[None, "", "technology", 123])

    call_args = mock_fetch.call_args
    query = call_args[1]["query"]
    assert "Science and Technology" in query


@patch("app.crud.news.fetch_news")
async def test_fetch_news_feed_all_invalid_topics(mock_fetch):
    mock_fetch.return_value = NewsResponse()

    await news_crud.fetch_news_feed(topics=[None, "", None])

    mock_fetch.assert_awaited_with(query="news", timestamp=None, size=10, country=None)


@patch("app.crud.news.fetch_news")
async def test_fetch_news_feed_with_country_and_timestamp(mock_fetch):
    mock_fetch.return_value = NewsResponse()

    await news_crud.fetch_news_feed(
        topics=["sports"], timestamp=1234567890, size=5, country="FR"
    )

    call_args = mock_fetch.call_args
    assert call_args[1]["timestamp"] == 1234567890
    assert call_args[1]["size"] == 5
    assert call_args[1]["country"] == "FR"


@patch("app.crud.news.fetch_news")
async def test_fetch_news_feed_first_topic_hard_truncated(mock_fetch):
    # GIVEN current_length is already high due to long sentiment + country,
    # so even the first topic part exceeds the 95 char limit
    mock_fetch.return_value = NewsResponse()

    # sentiment adds " sentiment:XXXX..." to current_length
    # country adds " thread.country:XXXX..." to current_length
    # Together they push current_length > 95 before any topic
    long_sentiment = "a" * 70  # " sentiment:" + 70 = 81 chars
    long_country = "XX"  # " thread.country:XX" = 18 chars => total ~99

    await news_crud.fetch_news_feed(
        topics=["sports"], sentiment=long_sentiment, country=long_country
    )

    # THEN the first topic part is hard-truncated but query is still built
    call_args = mock_fetch.call_args
    query = call_args[1]["query"]
    assert len(query) > 0


@patch("app.crud.news.fetch_news")
async def test_fetch_news_feed_topics_exceed_query_limit(mock_fetch):
    # GIVEN many unmapped topics that together exceed the 95 char limit
    mock_fetch.return_value = NewsResponse()
    # Each unmapped topic becomes title:"topicXXXXXXXXXX" (~24 chars) + " OR " (4 chars)
    topics = [f"topiclong{i}abcde" for i in range(10)]

    await news_crud.fetch_news_feed(topics=topics)

    # THEN some topics are dropped (break) but query still works
    call_args = mock_fetch.call_args
    query = call_args[1]["query"]
    assert len(query) <= 100


# ============================================================================
# fetch_news_by_topic Tests
# ============================================================================


@patch("app.crud.news.fetch_news")
async def test_fetch_news_by_topic_empty(mock_fetch):
    mock_fetch.return_value = NewsResponse()

    await news_crud.fetch_news_by_topic(topic="")

    mock_fetch.assert_awaited_with(query="news", timestamp=None, size=10, country=None)


@patch("app.crud.news.fetch_news")
async def test_fetch_news_by_topic_mapped(mock_fetch):
    mock_fetch.return_value = NewsResponse()

    await news_crud.fetch_news_by_topic(topic="technology")

    call_args = mock_fetch.call_args
    query = call_args[1]["query"]
    assert "Science and Technology" in query


@patch("app.crud.news.fetch_news")
async def test_fetch_news_by_topic_unmapped(mock_fetch):
    mock_fetch.return_value = NewsResponse()

    await news_crud.fetch_news_by_topic(topic="quantum computing")

    call_args = mock_fetch.call_args
    query = call_args[1]["query"]
    assert 'thread.title:"quantum computing"' in query


@patch("app.crud.news.fetch_news")
async def test_fetch_news_by_topic_with_sentiment(mock_fetch):
    mock_fetch.return_value = NewsResponse()

    await news_crud.fetch_news_by_topic(topic="sports", sentiment="positive")

    call_args = mock_fetch.call_args
    query = call_args[1]["query"]
    assert "sentiment:positive" in query


@patch("app.crud.news.fetch_news")
async def test_fetch_news_by_topic_with_country_and_timestamp(mock_fetch):
    mock_fetch.return_value = NewsResponse()

    await news_crud.fetch_news_by_topic(
        topic="sports", timestamp=1234567890, size=5, country="US"
    )

    call_args = mock_fetch.call_args
    assert call_args[1]["timestamp"] == 1234567890
    assert call_args[1]["size"] == 5
    assert call_args[1]["country"] == "US"


@patch("app.crud.news.fetch_news")
async def test_fetch_news_by_topic_escapes_quotes(mock_fetch):
    mock_fetch.return_value = NewsResponse()

    await news_crud.fetch_news_by_topic(topic='test "quotes"')

    call_args = mock_fetch.call_args
    query = call_args[1]["query"]
    assert '\\"' in query


# ============================================================================
# fetch_news_paginated Tests
# ============================================================================


@patch("app.crud.news.httpx.AsyncClient")
async def test_fetch_news_paginated_success(mock_client_class):
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "posts": [{"uuid": "p2", "title": "Page 2"}],
        "totalResults": 20,
        "moreResultsAvailable": 10,
        "requestsLeft": 98,
    }
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    result = await news_crud.fetch_news_paginated("/newsApiLite?token=xxx&next=abc")

    assert isinstance(result, NewsResponse)
    assert len(result.posts) == 1
    mock_client.get.assert_awaited_once_with(
        "https://api.webz.io/newsApiLite?token=xxx&next=abc"
    )


@patch("app.crud.news.httpx.AsyncClient")
async def test_fetch_news_paginated_http_error(mock_client_class):
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.text = "Server error"
    mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
        "Server error",
        request=MagicMock(),
        response=mock_response,
    )

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    with pytest.raises(HTTPException) as exc_info:
        await news_crud.fetch_news_paginated("/next")

    assert exc_info.value.status_code == 500


@patch("app.crud.news.httpx.AsyncClient")
async def test_fetch_news_paginated_request_error(mock_client_class):
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(
        side_effect=httpx.RequestError("Connection failed", request=MagicMock())
    )
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    with pytest.raises(HTTPException) as exc_info:
        await news_crud.fetch_news_paginated("/next")

    assert exc_info.value.status_code == 503


@patch("app.crud.news.httpx.AsyncClient")
async def test_fetch_news_paginated_value_error(mock_client_class):
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.side_effect = ValueError("Invalid JSON")

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    with pytest.raises(HTTPException) as exc_info:
        await news_crud.fetch_news_paginated("/next")

    assert exc_info.value.status_code == 500
    assert "validating" in exc_info.value.detail.lower()


@patch("app.crud.news.httpx.AsyncClient")
async def test_fetch_news_paginated_generic_error(mock_client_class):
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = "not a dict"

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    with pytest.raises(HTTPException) as exc_info:
        await news_crud.fetch_news_paginated("/next")

    assert exc_info.value.status_code == 500
