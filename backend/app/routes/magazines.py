from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.crud import article as crud_article
from app.crud import comment as crud_comment
from app.crud import magazine as crud_magazine
from app.crud import user as crud_user
from app.dependencies import get_current_user
from app.schemas.article import Article
from app.schemas.comment import CommentCreate, MagazineCommentWithUser
from app.schemas.magazine import Magazine, MagazineCreate, MagazineUpdate
from app.schemas.notification import NotificationCreate
from app.utils.article_enricher import enrich_articles
from app.crud import notification as crud_notification

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


@router.get("/{magazine_id}/comments", response_model=List[MagazineCommentWithUser])
async def get_magazine_comments(
    magazine_id: str, skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=100)
):
    magazine = await crud_magazine.get_magazine_by_id(magazine_id)
    if not magazine:
        raise HTTPException(status_code=404, detail="Magazine not found")

    comments = await crud_comment.get_comments_by_magazine(
        magazine_id, skip=skip, limit=limit
    )
    return comments


@router.post(
    "/{magazine_id}/comments",
    response_model=MagazineCommentWithUser,
    status_code=status.HTTP_201_CREATED,
)
async def create_magazine_comment(
    magazine_id: str,
    comment_in: CommentCreate,
    current_user: dict = Depends(get_current_user),
):
    magazine = await crud_magazine.get_magazine_by_id(magazine_id)
    if not magazine:
        raise HTTPException(status_code=404, detail="Magazine not found")

    comment = await crud_comment.create_magazine_comment(
        magazine_id, current_user["id"], comment_in
    )

    return comment


@router.post("/", response_model=Magazine)
async def create_magazine(
    magazine: MagazineCreate, current_user: dict = Depends(get_current_user)
):
    return await crud_magazine.create_magazine(
        user_id=current_user["id"], magazine=magazine
    )


@router.get("/", response_model=List[Magazine])
async def get_user_magazines(current_user: dict = Depends(get_current_user)):
    magazines = await crud_magazine.get_user_magazines(user_id=current_user["id"])
    return await crud_magazine.enrich_magazines_with_covers(magazines)


@router.get("/user/{user_id}", response_model=List[Magazine])
async def get_magazines_by_user(user_id: str):
    magazines = await crud_magazine.get_user_magazines(user_id=user_id)
    return await crud_magazine.enrich_magazines_with_covers(magazines)


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
    return await crud_magazine.enrich_magazines_with_covers(magazines)


@router.get("/explore", response_model=List[Magazine])
async def get_explore_magazines(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    magazines = await crud_magazine.get_all_magazines(
        skip=skip, limit=limit, exclude_user_id=current_user["id"]
    )
    return await crud_magazine.enrich_magazines_with_covers(magazines)


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
    enriched = await crud_magazine.enrich_magazines_with_covers([magazine])
    return enriched[0]


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

    # Notify followers of the magazine
    if magazine and article:
        followers = await crud_user.get_users_following_magazine(magazine_id)
        notification_message = (
            f"New article '{article['title']}' added to '{magazine['name']}' magazine."
        )
        for user_data in followers:
            # Ensure the magazine owner does not get a notification for their own action
            if user_data["id"] != current_user["id"]:
                notification_in = NotificationCreate(
                    user_id=user_data["id"],
                    magazine_id=magazine_id,
                    article_id=article_id,
                    message=notification_message,
                )
                await crud_notification.create_notification(notification_in)

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
