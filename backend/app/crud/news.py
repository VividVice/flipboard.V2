from typing import Optional

import httpx
from fastapi import HTTPException

from app.core.config import settings
from app.models.news import NewsResponse

WEBZ_IO_BASE_URL = "https://api.webz.io/newsApiLite"

# Map common topics to webz.io IPTC category filters
# We keep these compact but accurate to stay within the 100-character limit
TOPIC_MAPPING = {
    # English
    "financial and economic news": 'category:"Economy, Business and Finance"',
    "technology": 'category:"Science and Technology"',
    "politics": "category:Politics",
    "sports": "category:Sport",
    "entertainment": 'category:"Arts, Culture and Entertainment"',
    "health": "category:Health",
    "science": 'category:"Science and Technology"',
    "weather": "category:Weather",
    "education": "category:Education",
    "environment": "category:Environment",
    "crime": 'category:"Crime, Law and Justice"',
    # French
    "actualités": "language:french",
    "technologie": 'text:technologie OR category:"Science and Technology"',
    "sport": "category:Sport",
    "culture": 'text:culture OR category:"Arts, Culture and Entertainment"',
    "économie": 'text:économie OR category:"Economy, Business and Finance"',
    "santé": "category:Health",
    "environnement": "category:Environment",
    "politique": "category:Politics",
    "gastronomie": "text:gastronomie",
    "voyage": "text:voyage",
    "mode": "text:mode",
    "automobile": "text:automobile",
    "immobilier": "text:immobilier",
    "éducation": "category:Education",
    "musique": "text:musique",
    "cinéma": "text:cinéma",
    "jeux vidéo": "text:gaming",
    "livres": "text:livres",
    "photographie": "text:photo",
    "design": "text:design",
    "architecture": "text:architecture",
    "intelligence artificielle": 'text:"intelligence artificielle"',
    "cryptomonnaie": "text:crypto",
    "startups": "text:startups",
}


async def fetch_news(
    query: str = "news",
    timestamp: Optional[int] = None,
    size: int = 10,
    country: Optional[str] = None,
) -> NewsResponse:
    """
    Fetch news from webz.io News API Lite
    """
    full_query = query
    if country:
        # Append country filter. thread.country:US
        full_query = f"{query} thread.country:{country}"

    # Truncate query to 100 chars just in case (API Lite limit)
    safe_query = full_query[:100]

    params = {
        "token": settings.WEBZ_IO_API_KEY,
        "q": safe_query,
        "size": min(size, 10),  # API max is 10
    }

    if timestamp:
        params["ts"] = timestamp

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(WEBZ_IO_BASE_URL, params=params)
            response.raise_for_status()

            data = response.json()
            return NewsResponse(**data)
    except Exception as e:
        # Re-using previous error handling logic
        if isinstance(e, httpx.HTTPStatusError):
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Webz.io API error: {e.response.text}",
            )
        raise e


async def fetch_news_feed(
    topics: list[str],
    timestamp: Optional[int] = None,
    size: int = 10,
    country: Optional[str] = None,
) -> NewsResponse:
    """
    Fetch news for a list of topics combined with OR logic.
    Lite API has a 100 character limit.
    """
    if not topics:
        return await fetch_news(
            query="news", timestamp=timestamp, size=size, country=country
        )

    query_parts = []
    current_length = 0
    # Add country filter length if applicable
    if country:
        current_length += len(f" thread.country:{country}")

    for topic in topics[:5]:  # Try up to 5 topics
        if not topic or not isinstance(topic, str):
            continue

        topic_lower = topic.lower()
        part = ""
        if topic_lower in TOPIC_MAPPING:
            part = TOPIC_MAPPING[topic_lower]
        else:
            safe_topic = topic.replace('"', "")[:15]
            part = f'title:"{safe_topic}"'

        # Check if adding this part (and " OR " if not first) exceeds limit
        separator = " OR " if query_parts else ""
        if current_length + len(separator) + len(part) > 95:  # Stay slightly under 100
            if not query_parts:  # If even the first part is too long
                part = part[:90]  # Hard truncate
            else:
                break  # Stop adding topics

        query_parts.append(part)
        current_length += len(separator) + len(part)

    if not query_parts:
        return await fetch_news(
            query="news", timestamp=timestamp, size=size, country=country
        )

    combined_query = " OR ".join(query_parts)

    print(
        f"DEBUG: Generated news feed query ({len(combined_query)} chars): {combined_query}"
    )

    return await fetch_news(
        query=combined_query, timestamp=timestamp, size=size, country=country
    )


async def fetch_news_by_topic(
    topic: str,
    sentiment: Optional[str] = None,
    timestamp: Optional[int] = None,
    size: int = 10,
    country: Optional[str] = None,
) -> NewsResponse:
    """
    Fetch news filtered by topic and optionally sentiment
    """
    if not topic:
        return await fetch_news(
            query="news", timestamp=timestamp, size=size, country=country
        )

    # Use mapped query if available, otherwise search in title
    topic_lower = topic.lower()
    if topic_lower in TOPIC_MAPPING:
        query_parts = [TOPIC_MAPPING[topic_lower]]
    else:
        # Escape double quotes in topic name
        safe_topic = topic.replace('"', '\\"')
        # For unmapped topics, search in article titles
        query_parts = [f'thread.title:"{safe_topic}"']

    if sentiment:
        query_parts.append(f"sentiment:{sentiment}")

    query = " ".join(query_parts)

    return await fetch_news(
        query=query, timestamp=timestamp, size=size, country=country
    )


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
            detail=f"Webz.io API error: {e.response.text}",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503, detail=f"Failed to connect to Webz.io API: {str(e)}"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=500, detail=f"Error validating news data: {str(e)}"
        )
    except Exception as e:
        import traceback

        error_detail = f"Error processing news data: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(
            status_code=500, detail=f"Error processing news data: {str(e)}"
        )
