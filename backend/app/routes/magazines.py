from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.crud import article as crud_article
from app.crud import magazine as crud_magazine
from app.crud import user as crud_user
from app.dependencies import get_current_user
from app.schemas.article import Article
from app.schemas.magazine import Magazine, MagazineCreate, MagazineUpdate
from app.utils.article_enricher import enrich_articles

router = APIRouter()


@router.get("/{magazine_id}/articles", response_model=List[Article])
async def get_magazine_articles(
    magazine_id: str, current_user: dict = Depends(get_current_user)
):
    magazine = await crud_magazine.get_magazine_by_id(magazine_id)
    if not magazine:
        raise HTTPException(status_code=404, detail="Magazine not found")

    # For now, allow public viewing of all magazines to support Public Profiles.
    # In the future, a 'is_public' flag could be added to the Magazine model.

    article_ids = magazine.get("article_ids", [])
    if not article_ids:
        return []

    articles = await crud_article.get_articles_by_ids(article_ids)
    return await enrich_articles(articles, current_user)


@router.post("/", response_model=Magazine)
async def create_magazine(
    magazine: MagazineCreate, current_user: dict = Depends(get_current_user)
):
    return await crud_magazine.create_magazine(
        user_id=current_user["id"], magazine=magazine
    )


@router.get("/", response_model=List[Magazine])
async def get_user_magazines(current_user: dict = Depends(get_current_user)):
    return await crud_magazine.get_user_magazines(user_id=current_user["id"])


@router.get("/user/{user_id}", response_model=List[Magazine])
async def get_magazines_by_user(user_id: str):
    return await crud_magazine.get_user_magazines(user_id=user_id)


@router.get("/followed/me", response_model=List[Magazine])
async def get_followed_magazines(current_user: dict = Depends(get_current_user)):
    magazine_ids = current_user.get("followed_magazines", [])
    if not magazine_ids:
        return []

    magazines = []
    for mag_id in magazine_ids:
        mag = await crud_magazine.get_magazine_by_id(mag_id)
        if mag:
            magazines.append(mag)
    return magazines


@router.post("/{magazine_id}/follow")
async def follow_magazine(
    magazine_id: str, current_user: dict = Depends(get_current_user)
):
    mag = await crud_magazine.get_magazine_by_id(magazine_id)
    if not mag:
        raise HTTPException(status_code=404, detail="Magazine not found")

    if mag["user_id"] == current_user["id"]:
        raise HTTPException(
            status_code=400, detail="You cannot follow your own magazine"
        )

    await crud_user.follow_magazine(current_user["id"], magazine_id)
    return {"message": "Successfully followed magazine"}


@router.post("/{magazine_id}/unfollow")
async def unfollow_magazine(
    magazine_id: str, current_user: dict = Depends(get_current_user)
):
    await crud_user.unfollow_magazine(current_user["id"], magazine_id)
    return {"message": "Successfully unfollowed magazine"}


@router.get("/{magazine_id}", response_model=Magazine)
async def get_magazine(
    magazine_id: str, current_user: dict = Depends(get_current_user)
):
    magazine = await crud_magazine.get_magazine_by_id(magazine_id)
    if not magazine:
        raise HTTPException(status_code=404, detail="Magazine not found")
    # Optional: Check ownership or visibility
    return magazine


@router.put("/{magazine_id}", response_model=Magazine)
async def update_magazine(
    magazine_id: str,
    magazine_update: MagazineUpdate,
    current_user: dict = Depends(get_current_user),
):
    magazine = await crud_magazine.get_magazine_by_id(magazine_id)
    if not magazine:
        raise HTTPException(status_code=404, detail="Magazine not found")
    if magazine["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=403, detail="Not authorized to update this magazine"
        )

    await crud_magazine.update_magazine(magazine_id, magazine_update)
    return await crud_magazine.get_magazine_by_id(magazine_id)


@router.delete("/{magazine_id}")
async def delete_magazine(
    magazine_id: str, current_user: dict = Depends(get_current_user)
):
    magazine = await crud_magazine.get_magazine_by_id(magazine_id)
    if not magazine:
        raise HTTPException(status_code=404, detail="Magazine not found")
    if magazine["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this magazine"
        )

    await crud_magazine.delete_magazine(magazine_id)
    return {"message": "Magazine deleted"}


@router.post("/{magazine_id}/articles/{article_id}")
async def add_article(
    magazine_id: str, article_id: str, current_user: dict = Depends(get_current_user)
):
    magazine = await crud_magazine.get_magazine_by_id(magazine_id)
    if not magazine:
        raise HTTPException(status_code=404, detail="Magazine not found")
    if magazine["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=403, detail="Not authorized to modify this magazine"
        )

    article = await crud_article.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    await crud_magazine.add_article_to_magazine(magazine_id, article_id)
    return {"message": "Article added to magazine"}


@router.delete("/{magazine_id}/articles/{article_id}")
async def remove_article(
    magazine_id: str, article_id: str, current_user: dict = Depends(get_current_user)
):
    magazine = await crud_magazine.get_magazine_by_id(magazine_id)
    if not magazine:
        raise HTTPException(status_code=404, detail="Magazine not found")
    if magazine["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=403, detail="Not authorized to modify this magazine"
        )

    await crud_magazine.remove_article_from_magazine(magazine_id, article_id)
    return {"message": "Article removed from magazine"}
