from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional
from app.crud import news as news_crud
from app.models.news import NewsResponse

router = APIRouter()


@router.get("/", response_model=NewsResponse)
async def get_news(
    q: str = Query("news", description="Search query. Supports advanced filters like 'topic:' and 'sentiment:'"),
    ts: Optional[int] = Query(None, description="Unix timestamp in milliseconds for historical data (up to 30 days)"),
    size: int = Query(10, ge=1, le=10, description="Number of results to return (max 10)")
):
    """
    Fetch news from webz.io News API Lite

    Example queries:
    - Simple search: `q=Bitcoin`
    - Topic filter: `q=topic:"financial and economic news"`
    - Sentiment filter: `q=Google sentiment:negative`
    - Combined: `q=Google topic:"financial and economic news" sentiment:negative`

    The API returns up to 10 results per request. Use the 'next' field in the response
    to fetch subsequent pages via the `/news/next` endpoint.
    """
    return await news_crud.fetch_news(query=q, timestamp=ts, size=size)


@router.get("/topic/{topic}", response_model=NewsResponse)
async def get_news_by_topic(
    topic: str,
    sentiment: Optional[str] = Query(None, description="Filter by sentiment: positive, negative, or neutral"),
    ts: Optional[int] = Query(None, description="Unix timestamp in milliseconds"),
    size: int = Query(10, ge=1, le=10)
):
    """
    Fetch news filtered by topic and optionally sentiment

    Example topics:
    - "financial and economic news"
    - "technology"
    - "sports"

    Example sentiments:
    - "positive"
    - "negative"
    - "neutral"
    """
    if sentiment and sentiment not in ["positive", "negative", "neutral"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sentiment must be one of: positive, negative, neutral"
        )

    return await news_crud.fetch_news_by_topic(
        topic=topic,
        sentiment=sentiment,
        timestamp=ts,
        size=size
    )


@router.get("/next", response_model=NewsResponse)
async def get_next_news_page(
    next_url: str = Query(..., description="The 'next' URL path from a previous NewsResponse")
):
    """
    Fetch the next page of news results

    Use the 'next' field from a previous response (e.g., "/newsApiLite?token=...&from=10")
    to paginate through results.

    Note: The webz.io API includes a maximum of 1,000 monthly calls, with up to 10 results per call.
    """
    return await news_crud.fetch_news_paginated(next_url)
