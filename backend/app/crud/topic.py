import uuid
from datetime import datetime
from typing import List, Optional

from app.db.database import db
from app.schemas.topic import TopicCreate, TopicUpdate


async def get_topic_by_id(topic_id: str):
    return await db.topics.find_one({"id": topic_id})


async def get_topic_by_name(name: str):
    return await db.topics.find_one({"name": name})


async def get_topics(skip: int = 0, limit: int = 100, search: Optional[str] = None):
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    cursor = db.topics.find(query).skip(skip).limit(limit).sort("name", 1)
    topics = await cursor.to_list(length=limit)
    return topics


async def get_topics_count(search: Optional[str] = None):
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    return await db.topics.count_documents(query)


async def create_topic(topic: TopicCreate):
    topic_doc = topic.dict()
    topic_doc["id"] = str(uuid.uuid4())
    topic_doc["follower_count"] = 0
    topic_doc["created_at"] = datetime.utcnow()

    await db.topics.insert_one(topic_doc)
    return await get_topic_by_id(topic_doc["id"])


async def update_topic(topic_id: str, topic: TopicUpdate):
    update_data = {
        k: v for k, v in topic.dict(exclude_unset=True).items() if v is not None
    }
    if update_data:
        await db.topics.update_one({"id": topic_id}, {"$set": update_data})
    return await get_topic_by_id(topic_id)


async def delete_topic(topic_id: str):
    result = await db.topics.delete_one({"id": topic_id})
    return result.deleted_count > 0


async def increment_follower_count(topic_id: str, increment: int = 1):
    await db.topics.update_one(
        {"id": topic_id}, {"$inc": {"follower_count": increment}}
    )


async def get_topics_by_ids(topic_ids: List[str]):
    cursor = db.topics.find({"id": {"$in": topic_ids}})
    topics = await cursor.to_list(length=len(topic_ids))
    return topics
