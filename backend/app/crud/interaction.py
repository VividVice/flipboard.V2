import uuid
from datetime import datetime
from typing import Dict, List

from app.db.database import db


async def get_interaction(user_id: str, article_id: str):
    return await db.user_interactions.find_one(
        {"user_id": user_id, "article_id": article_id}
    )


async def toggle_like(user_id: str, article_id: str):
    interaction = await get_interaction(user_id, article_id)

    if not interaction:
        interaction_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "article_id": article_id,
            "is_liked": True,
            "is_saved": False,
            "liked_at": datetime.utcnow(),
            "saved_at": None,
        }
        await db.user_interactions.insert_one(interaction_doc)
        return await get_interaction(user_id, article_id), 1
    else:
        new_is_liked = not interaction.get("is_liked", False)
        update_data = {
            "is_liked": new_is_liked,
            "liked_at": datetime.utcnow() if new_is_liked else None,
        }
        await db.user_interactions.update_one(
            {"user_id": user_id, "article_id": article_id}, {"$set": update_data}
        )
        increment = 1 if new_is_liked else -1
        return await get_interaction(user_id, article_id), increment


async def toggle_save(user_id: str, article_id: str):
    interaction = await get_interaction(user_id, article_id)

    if not interaction:
        interaction_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "article_id": article_id,
            "is_liked": False,
            "is_saved": True,
            "liked_at": None,
            "saved_at": datetime.utcnow(),
        }
        await db.user_interactions.insert_one(interaction_doc)
        return await get_interaction(user_id, article_id)
    else:
        new_is_saved = not interaction.get("is_saved", False)
        update_data = {
            "is_saved": new_is_saved,
            "saved_at": datetime.utcnow() if new_is_saved else None,
        }
        await db.user_interactions.update_one(
            {"user_id": user_id, "article_id": article_id}, {"$set": update_data}
        )
        return await get_interaction(user_id, article_id)


async def get_user_liked_articles(user_id: str, skip: int = 0, limit: int = 20):
    cursor = (
        db.user_interactions.find({"user_id": user_id, "is_liked": True})
        .sort("liked_at", -1)
        .skip(skip)
        .limit(limit)
    )

    interactions = await cursor.to_list(length=limit)
    article_ids = [interaction["article_id"] for interaction in interactions]

    if not article_ids:
        return []

    articles_cursor = db.articles.find({"id": {"$in": article_ids}})
    articles = await articles_cursor.to_list(length=len(article_ids))

    return articles


async def get_user_saved_articles(user_id: str, skip: int = 0, limit: int = 20):
    cursor = (
        db.user_interactions.find({"user_id": user_id, "is_saved": True})
        .sort("saved_at", -1)
        .skip(skip)
        .limit(limit)
    )

    interactions = await cursor.to_list(length=limit)
    article_ids = [interaction["article_id"] for interaction in interactions]

    if not article_ids:
        return []

    articles_cursor = db.articles.find({"id": {"$in": article_ids}})
    articles = await articles_cursor.to_list(length=len(article_ids))

    return articles


async def get_user_interactions_for_articles(
    user_id: str, article_ids: List[str]
) -> Dict[str, Dict]:
    cursor = db.user_interactions.find(
        {"user_id": user_id, "article_id": {"$in": article_ids}}
    )

    interactions = await cursor.to_list(length=len(article_ids))

    result = {}
    for interaction in interactions:
        result[interaction["article_id"]] = {
            "is_liked": interaction.get("is_liked", False),
            "is_saved": interaction.get("is_saved", False),
        }

    for article_id in article_ids:
        if article_id not in result:
            result[article_id] = {"is_liked": False, "is_saved": False}

    return result
