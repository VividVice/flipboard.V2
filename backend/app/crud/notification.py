import uuid
from datetime import datetime
from typing import List, Optional

from app.db.database import db
from app.schemas.notification import NotificationCreate, NotificationUpdate


async def create_notification(notification: NotificationCreate):
    notification_doc = notification.dict()
    if not notification_doc.get("id"):
        notification_doc["id"] = str(uuid.uuid4())
    notification_doc["created_at"] = datetime.utcnow()

    await db.notifications.insert_one(notification_doc)
    return await db.notifications.find_one({"id": notification_doc["id"]})


async def get_notifications_for_user(
    user_id: str, skip: int = 0, limit: int = 100, read: Optional[bool] = None
):
    query = {"user_id": user_id}
    if read is not None:
        query["read"] = read

    cursor = (
        db.notifications.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    return await cursor.to_list(length=limit)


async def mark_notification_as_read(notification_id: str, user_id: str):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": user_id},
        {"$set": {"read": True}},
    )
    return result.modified_count > 0


async def mark_all_notifications_as_read(user_id: str):
    result = await db.notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}},
    )
    return result.modified_count


async def get_unread_notifications_count(user_id: str):
    return await db.notifications.count_documents(
        {"user_id": user_id, "read": False}
    )
