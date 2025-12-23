import uuid
from datetime import datetime
from typing import List, Optional

from app.db.database import db
from app.schemas.article import ArticleCreate, ArticleUpdate


async def get_article_by_id(article_id: str, increment_view: bool = False):
    if increment_view:
        await db.articles.update_one({"id": article_id}, {"$inc": {"view_count": 1}})
    return await db.articles.find_one({"id": article_id})


async def get_articles(
    skip: int = 0,
    limit: int = 20,
    topic: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "published_at",
):
    query = {}

    if topic:
        query["topics"] = topic

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"excerpt": {"$regex": search, "$options": "i"}},
        ]

    sort_order = -1 if sort_by in ["published_at", "view_count", "like_count"] else 1

    cursor = db.articles.find(query).sort(sort_by, sort_order).skip(skip).limit(limit)
    articles = await cursor.to_list(length=limit)
    return articles


async def get_articles_count(topic: Optional[str] = None, search: Optional[str] = None):
    query = {}

    if topic:
        query["topics"] = topic

    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"excerpt": {"$regex": search, "$options": "i"}},
        ]

    return await db.articles.count_documents(query)


async def get_hero_article():
    cursor = db.articles.find().sort("view_count", -1).limit(1)
    articles = await cursor.to_list(length=1)
    return articles[0] if articles else None


async def create_article(article: ArticleCreate):
    article_doc = article.dict()
    if not article_doc.get("id"):
        article_doc["id"] = str(uuid.uuid4())
    article_doc["view_count"] = 0
    article_doc["like_count"] = 0
    article_doc["comment_count"] = 0
    article_doc["created_at"] = datetime.utcnow()

    await db.articles.insert_one(article_doc)
    return await get_article_by_id(article_doc["id"])


async def update_article(article_id: str, article: ArticleUpdate):
    update_data = {
        k: v for k, v in article.dict(exclude_unset=True).items() if v is not None
    }
    if update_data:
        await db.articles.update_one({"id": article_id}, {"$set": update_data})
    return await get_article_by_id(article_id)


async def delete_article(article_id: str):
    result = await db.articles.delete_one({"id": article_id})
    return result.deleted_count > 0


async def increment_like_count(article_id: str, increment: int = 1):
    await db.articles.update_one(
        {"id": article_id}, {"$inc": {"like_count": increment}}
    )


async def increment_comment_count(article_id: str, increment: int = 1):
    await db.articles.update_one(
        {"id": article_id}, {"$inc": {"comment_count": increment}}
    )


async def get_articles_by_topic_ids(
    topic_ids: List[str], skip: int = 0, limit: int = 20
):
    query = {"topics": {"$in": topic_ids}}
    cursor = db.articles.find(query).sort("published_at", -1).skip(skip).limit(limit)
    articles = await cursor.to_list(length=limit)
    return articles


async def get_article_by_url(source_url: str):
    return await db.articles.find_one({"source_url": source_url})


async def get_articles_by_urls(urls: List[str]):
    cursor = db.articles.find({"source_url": {"$in": urls}})
    return await cursor.to_list(length=len(urls))


async def get_articles_by_ids(article_ids: List[str]):
    cursor = db.articles.find({"id": {"$in": article_ids}})
    return await cursor.to_list(length=len(article_ids))
