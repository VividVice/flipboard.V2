import uuid
from datetime import datetime

from app.crud import user as user_crud
from app.db.database import db
from app.schemas.comment import CommentCreate, CommentUpdate


async def get_comment_by_id(comment_id: str):
    return await db.comments.find_one({"id": comment_id})


async def get_comments_by_article(article_id: str, skip: int = 0, limit: int = 100):
    cursor = (
        db.comments.find({"article_id": article_id})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    comments = await cursor.to_list(length=limit)

    for comment in comments:
        user = await user_crud.get_user_by_id(comment["user_id"])
        if user:
            comment["user"] = {
                "id": user.get("id"),
                "username": user.get("username"),
                "profile_pic": user.get("profile_pic"),
            }
        else:
            comment["user"] = {
                "id": comment["user_id"],
                "username": "Unknown User",
                "profile_pic": None,
            }

    return comments


async def get_comments_count(article_id: str):
    return await db.comments.count_documents({"article_id": article_id})


async def get_comments_by_user(user_id: str, skip: int = 0, limit: int = 100):
    cursor = (
        db.comments.find({"user_id": user_id})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    comments = await cursor.to_list(length=limit)

    user = await user_crud.get_user_by_id(user_id)
    user_info = (
        {
            "id": user.get("id"),
            "username": user.get("username"),
            "profile_pic": user.get("profile_pic"),
        }
        if user
        else {"id": user_id, "username": "Unknown User", "profile_pic": None}
    )

    for comment in comments:
        # Add article info
        article = await db.articles.find_one({"id": comment["article_id"]})
        if article:
            comment["article_title"] = article.get("title")
        else:
            comment["article_title"] = "Deleted Article"

        # Add user info
        comment["user"] = user_info

    return comments


async def create_comment(article_id: str, user_id: str, comment: CommentCreate):
    comment_doc = comment.dict()
    comment_doc["id"] = str(uuid.uuid4())
    comment_doc["article_id"] = article_id
    comment_doc["user_id"] = user_id
    comment_doc["created_at"] = datetime.utcnow()
    comment_doc["updated_at"] = None

    await db.comments.insert_one(comment_doc)
    created_comment = await get_comment_by_id(comment_doc["id"])

    user = await user_crud.get_user_by_id(user_id)
    if user:
        created_comment["user"] = {
            "id": user.get("id"),
            "username": user.get("username"),
            "profile_pic": user.get("profile_pic"),
        }
    else:
        created_comment["user"] = {
            "id": user_id,
            "username": "Unknown User",
            "profile_pic": None,
        }

    return created_comment


async def update_comment(comment_id: str, comment: CommentUpdate):
    update_data = comment.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()

    await db.comments.update_one({"id": comment_id}, {"$set": update_data})
    return await get_comment_by_id(comment_id)


async def delete_comment(comment_id: str):
    result = await db.comments.delete_one({"id": comment_id})
    return result.deleted_count > 0
