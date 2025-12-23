from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.crud import article as article_crud
from app.crud import interaction as interaction_crud
from app.dependencies import get_current_user
from app.schemas.article import Article
from app.schemas.interaction import InteractionStatus
from app.utils.article_enricher import enrich_articles

router = APIRouter()


@router.post("/articles/{article_id}/like")
async def toggle_like_article(
    article_id: str, current_user: dict = Depends(get_current_user)
):
    article = await article_crud.get_article_by_id(article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Article not found"
        )

    interaction, like_increment = await interaction_crud.toggle_like(
        current_user["id"], article_id
    )

    await article_crud.increment_like_count(article_id, like_increment)

    return {
        "article_id": article_id,
        "is_liked": interaction.get("is_liked", False),
        "is_saved": interaction.get("is_saved", False),
    }


@router.post("/articles/{article_id}/save")
async def toggle_save_article(
    article_id: str, current_user: dict = Depends(get_current_user)
):
    article = await article_crud.get_article_by_id(article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Article not found"
        )

    interaction = await interaction_crud.toggle_save(current_user["id"], article_id)

    return {
        "article_id": article_id,
        "is_liked": interaction.get("is_liked", False),
        "is_saved": interaction.get("is_saved", False),
    }


@router.get("/articles/{article_id}/status", response_model=InteractionStatus)
async def get_article_interaction_status(
    article_id: str, current_user: dict = Depends(get_current_user)
):
    interaction = await interaction_crud.get_interaction(current_user["id"], article_id)

    if not interaction:
        return InteractionStatus(article_id=article_id, is_liked=False, is_saved=False)

    return InteractionStatus(
        article_id=article_id,
        is_liked=interaction.get("is_liked", False),
        is_saved=interaction.get("is_saved", False),
    )


@router.get("/me/liked", response_model=List[Article])
async def get_liked_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    articles = await interaction_crud.get_user_liked_articles(
        current_user["id"], skip=skip, limit=limit
    )
    return await enrich_articles(articles, current_user)


@router.get("/me/saved", response_model=List[Article])
async def get_saved_articles(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    articles = await interaction_crud.get_user_saved_articles(
        current_user["id"], skip=skip, limit=limit
    )
    return await enrich_articles(articles, current_user)
