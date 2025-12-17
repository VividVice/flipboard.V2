from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status, Depends
from app.crud import news as news_crud
from app.crud import article as article_crud
from app.crud import interaction as interaction_crud
from app.models.news import NewsResponse
from app.utils.scraper import scrape_article_content
from app.dependencies import get_current_user_optional

router = APIRouter()


async def enrich_news_response(response: NewsResponse, user: Optional[dict]):
    if not user or not response.posts:
        return response
    
    urls = [post.url for post in response.posts]
    
    # Find existing articles in DB by URL
    existing_articles = await article_crud.get_articles_by_urls(urls)
    existing_map = {a["source_url"]: a for a in existing_articles}
    
    if not existing_map:
        return response

    # Get interaction status for these existing articles
    article_ids = [a["id"] for a in existing_articles]
    interactions_map = await interaction_crud.get_user_interactions_for_articles(user["id"], article_ids)
    
    # Update posts
    for post in response.posts:
        if post.url in existing_map:
            article_id = existing_map[post.url]["id"]
            status = interactions_map.get(article_id, {})
            post.liked = status.get("is_liked", False)
            post.saved = status.get("is_saved", False)
            
    return response


@router.get("/content")
async def get_article_content(
    url: str = Query(..., description="The URL of the article to scrape")
):
    """
    Scrape the full content of an article from a given URL.
    """
    try:
        content = await scrape_article_content(url)
        return {"content": content}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to scrape content: {str(e)}"
        )


@router.get("/", response_model=NewsResponse)
async def get_news(
    q: str = Query("news", description="Search query. Supports advanced filters like 'topic:' and 'sentiment:'"),
    ts: Optional[int] = Query(None, description="Unix timestamp in milliseconds for historical data (up to 30 days)"),
    size: int = Query(10, ge=1, le=10, description="Number of results to return (max 10)"),
    current_user: Optional[dict] = Depends(get_current_user_optional)
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
    response = await news_crud.fetch_news(query=q, timestamp=ts, size=size)
    return await enrich_news_response(response, current_user)


@router.get("/topic/{topic}", response_model=NewsResponse)
async def get_news_by_topic(
    topic: str,
    sentiment: Optional[str] = Query(None, description="Filter by sentiment: positive, negative, or neutral"),
    ts: Optional[int] = Query(None, description="Unix timestamp in milliseconds"),
    size: int = Query(10, ge=1, le=10),
    current_user: Optional[dict] = Depends(get_current_user_optional)
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

    response = await news_crud.fetch_news_by_topic(
        topic=topic,
        sentiment=sentiment,
        timestamp=ts,
        size=size
    )
    return await enrich_news_response(response, current_user)


@router.get("/next", response_model=NewsResponse)
async def get_next_news_page(
    next_url: str = Query(..., description="The 'next' URL path from a previous NewsResponse"),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Fetch the next page of news results

    Use the 'next' field from a previous response (e.g., "/newsApiLite?token=...&from=10")
    to paginate through results.

    Note: The webz.io API includes a maximum of 1,000 monthly calls, with up to 10 results per call.
    """
    response = await news_crud.fetch_news_paginated(next_url)
    return await enrich_news_response(response, current_user)
