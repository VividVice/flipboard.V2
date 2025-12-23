from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.magazine import Magazine, MagazineCreate, MagazineUpdate
from app.schemas.article import Article
from app.crud import magazine as crud_magazine
from app.crud import article as crud_article
from app.dependencies import get_current_user
from app.utils.article_enricher import enrich_articles

router = APIRouter()

@router.get("/{magazine_id}/articles", response_model=List[Article])
async def get_magazine_articles(
    magazine_id: str,
    current_user: dict = Depends(get_current_user)
):
    magazine = await crud_magazine.get_magazine_by_id(magazine_id)
    if not magazine:
        raise HTTPException(status_code=404, detail="Magazine not found")
    
    # Check if user can view this magazine (assuming private for now, or public if we had a flag)
    # For now, allow only if it's the user's magazine. Deny access for non-owners until public visibility is implemented.
    if magazine["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this magazine",
        )

    article_ids = magazine.get("article_ids", [])
    if not article_ids:
        return []
        
    articles = await crud_article.get_articles_by_ids(article_ids)
    return await enrich_articles(articles, current_user)

@router.post("/", response_model=Magazine)
async def create_magazine(
    magazine: MagazineCreate,
    current_user: dict = Depends(get_current_user)
):
    return await crud_magazine.create_magazine(user_id=current_user["id"], magazine=magazine)

@router.get("/", response_model=List[Magazine])
async def get_user_magazines(
    current_user: dict = Depends(get_current_user)
):
    return await crud_magazine.get_user_magazines(user_id=current_user["id"])

@router.get("/{magazine_id}", response_model=Magazine)
async def get_magazine(
    magazine_id: str,
    current_user: dict = Depends(get_current_user)
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
    current_user: dict = Depends(get_current_user)
):
    magazine = await crud_magazine.get_magazine_by_id(magazine_id)
    if not magazine:
        raise HTTPException(status_code=404, detail="Magazine not found")
    if magazine["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this magazine")
    
    await crud_magazine.update_magazine(magazine_id, magazine_update)
    return await crud_magazine.get_magazine_by_id(magazine_id)

@router.delete("/{magazine_id}")
async def delete_magazine(
    magazine_id: str,
    current_user: dict = Depends(get_current_user)
):
    magazine = await crud_magazine.get_magazine_by_id(magazine_id)
    if not magazine:
        raise HTTPException(status_code=404, detail="Magazine not found")
    if magazine["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this magazine")
    
    await crud_magazine.delete_magazine(magazine_id)
    return {"message": "Magazine deleted"}

@router.post("/{magazine_id}/articles/{article_id}")
async def add_article(
    magazine_id: str,
    article_id: str,
    current_user: dict = Depends(get_current_user)
):
    magazine = await crud_magazine.get_magazine_by_id(magazine_id)
    if not magazine:
        raise HTTPException(status_code=404, detail="Magazine not found")
    if magazine["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to modify this magazine")
    
    await crud_magazine.add_article_to_magazine(magazine_id, article_id)
    return {"message": "Article added to magazine"}

@router.delete("/{magazine_id}/articles/{article_id}")
async def remove_article(
    magazine_id: str,
    article_id: str,
    current_user: dict = Depends(get_current_user)
):
    magazine = await crud_magazine.get_magazine_by_id(magazine_id)
    if not magazine:
        raise HTTPException(status_code=404, detail="Magazine not found")
    if magazine["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to modify this magazine")
    
    await crud_magazine.remove_article_from_magazine(magazine_id, article_id)
    return {"message": "Article removed from magazine"}
