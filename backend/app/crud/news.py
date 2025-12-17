import httpx
from typing import Optional
from app.core.config import settings
from app.models.news import NewsResponse, NewsQueryParams
from fastapi import HTTPException


WEBZ_IO_BASE_URL = "https://api.webz.io/newsApiLite"


async def fetch_news(
    query: str = "news",
    timestamp: Optional[int] = None,
    size: int = 10
) -> NewsResponse:
    """
    Fetch news from webz.io News API Lite

    Args:
        query: Search query (can include advanced filters like topic:, sentiment:, etc.)
        timestamp: Unix timestamp in milliseconds (for historical data, up to 30 days)
        size: Number of results to return (max 10 per request)

    Returns:
        NewsResponse object with posts and metadata
    """
    params = {
        "token": settings.WEBZ_IO_API_KEY,
        "q": query,
        "size": min(size, 10)  # API max is 10
    }

    if timestamp:
        params["ts"] = timestamp

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(WEBZ_IO_BASE_URL, params=params)
            response.raise_for_status()

            data = response.json()
            return NewsResponse(**data)

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Webz.io API error: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to Webz.io API: {str(e)}"
        )
    except ValueError as e:
        # Pydantic validation error
        raise HTTPException(
            status_code=500,
            detail=f"Error validating news data: {str(e)}"
        )
    except Exception as e:
        # Generic error with more details
        import traceback
        error_detail = f"Error processing news data: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log to console for debugging
        raise HTTPException(
            status_code=500,
            detail=f"Error processing news data: {str(e)}"
        )


async def fetch_news_by_topic(
    topic: str,
    sentiment: Optional[str] = None,
    timestamp: Optional[int] = None,
    size: int = 10
) -> NewsResponse:
    """
    Fetch news filtered by topic and optionally sentiment

    Args:
        topic: Topic to filter by (e.g., "financial and economic news", "technology")
        sentiment: Sentiment filter (positive, negative, or neutral)
        timestamp: Unix timestamp in milliseconds
        size: Number of results to return

    Returns:
        NewsResponse object
    """
    # Map common topics to webz.io IPTC category filters
    # Based on: https://docs.webz.io/reference/news-api-lite
    # Full IPTC category list: Arts/Culture/Entertainment, Crime/Law/Justice,
    # Disaster/Accident, Economy/Business/Finance, Education, Environment, Health,
    # Human Interest, Labor, Lifestyle/Leisure, Politics, Religion/Belief,
    # Science/Technology, Social Issue, Sport, War/Conflict/Unrest, Weather
    topic_mapping = {
        "financial and economic news": 'category:"Economy, Business and Finance"',
        "technology": 'category:"Science and Technology"',
        "politics": 'category:Politics',
        "sports": 'category:Sport',
        "entertainment": 'category:"Arts, Culture and Entertainment"',
        "health": 'category:Health',
        "science": 'category:"Science and Technology"',
        "weather": 'category:Weather',
        "education": 'category:Education',
        "environment": 'category:Environment',
        "crime": 'category:"Crime, Law and Justice"'
    }

    # Use mapped query if available, otherwise search in title
    if topic.lower() in topic_mapping:
        query_parts = [topic_mapping[topic.lower()]]
    else:
        # For unmapped topics, search in article titles
        query_parts = [f'thread.title:{topic}']

    if sentiment:
        query_parts.append(f"sentiment:{sentiment}")

    query = " ".join(query_parts)

    return await fetch_news(query=query, timestamp=timestamp, size=size)


async def fetch_news_paginated(next_url: str) -> NewsResponse:
    """
    Fetch the next page of news results using the 'next' URL from a previous response

    Args:
        next_url: The relative URL path from the 'next' field in NewsResponse

    Returns:
        NewsResponse object with the next page of results
    """
    try:
        full_url = f"https://api.webz.io{next_url}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(full_url)
            response.raise_for_status()

            data = response.json()
            return NewsResponse(**data)

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Webz.io API error: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to Webz.io API: {str(e)}"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error validating news data: {str(e)}"
        )
    except Exception as e:
        import traceback
        error_detail = f"Error processing news data: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing news data: {str(e)}"
        )
