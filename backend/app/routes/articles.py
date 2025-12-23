from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.crud import article as article_crud
from app.dependencies import get_current_user
from app.schemas.article import Article, ArticleCreate, ArticleList, ArticleUpdate
from app.utils.article_enricher import enrich_article, enrich_articles

router = APIRouter()


@router.get("/", response_model=ArticleList)
async def get_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    topic: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query(
        "published_at", regex="^(published_at|view_count|like_count)$"
    ),
    current_user: dict = Depends(get_current_user),
):
    articles = await article_crud.get_articles(
        skip=skip, limit=limit, topic=topic, search=search, sort_by=sort_by
    )
    total = await article_crud.get_articles_count(topic=topic, search=search)

    articles = await enrich_articles(articles, current_user)

    return ArticleList(articles=articles, total=total, skip=skip, limit=limit)


@router.get("/hero", response_model=Article)
async def get_hero_article(current_user: dict = Depends(get_current_user)):
    article = await article_crud.get_hero_article()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No articles found"
        )
    return await enrich_article(article, current_user)


@router.get("/feed", response_model=ArticleList)
async def get_personalized_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    followed_topic_ids = current_user.get("followed_topics", [])

    if not followed_topic_ids:
        articles = await article_crud.get_articles(skip=skip, limit=limit)
        total = await article_crud.get_articles_count()
    else:
        articles = await article_crud.get_articles_by_topic_ids(
            followed_topic_ids, skip=skip, limit=limit
        )
        total = len(articles)

    articles = await enrich_articles(articles, current_user)

    return ArticleList(articles=articles, total=total, skip=skip, limit=limit)


@router.get("/{article_id}", response_model=Article)
async def get_article(article_id: str, current_user: dict = Depends(get_current_user)):
    article = await article_crud.get_article_by_id(article_id, increment_view=True)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Article not found"
        )
    return await enrich_article(article, current_user)


@router.post("/", response_model=Article, status_code=status.HTTP_201_CREATED)
async def create_article(
    article_in: ArticleCreate, current_user: dict = Depends(get_current_user)
):
    article = await article_crud.create_article(article_in)
    return article


@router.post("/import", response_model=Article, status_code=status.HTTP_200_OK)
async def import_article(
    article_in: ArticleCreate, current_user: dict = Depends(get_current_user)
):
    # Check if exists by URL
    existing = await article_crud.get_article_by_url(article_in.source_url)
    if existing:
        return await enrich_article(existing, current_user)

    # Create new
    article = await article_crud.create_article(article_in)
    return article


@router.put("/{article_id}", response_model=Article)
async def update_article(
    article_id: str,
    article_in: ArticleUpdate,
    current_user: dict = Depends(get_current_user),
):
    article = await article_crud.get_article_by_id(article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Article not found"
        )

    updated_article = await article_crud.update_article(article_id, article_in)
    return updated_article


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: str, current_user: dict = Depends(get_current_user)
):
    article = await article_crud.get_article_by_id(article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Article not found"
        )

    await article_crud.delete_article(article_id)
    return None
