import uuid
from datetime import datetime

from app.db.database import db
from app.schemas.user import UserCreate
from app.security.password import get_password_hash, verify_password


async def get_user_by_email(email: str):
    return await db.users.find_one({"email": email})


async def get_user_by_username(username: str):
    return await db.users.find_one({"username": username})


async def create_user(user: UserCreate):
    hashed_password = get_password_hash(user.password[:72])
    user_doc = user.dict()
    user_doc.pop("password")
    user_doc["hashed_password"] = hashed_password
    user_doc["id"] = str(uuid.uuid4())
    user_doc["created_at"] = datetime.utcnow()

    await db.users.insert_one(user_doc)
    return await get_user_by_username(user.username)


async def create_social_user(user_data: dict):
    user_doc = user_data.copy()
    user_doc["id"] = str(uuid.uuid4())
    user_doc["created_at"] = datetime.utcnow()
    # Set an unusable password for social users using a random, hashed value
    user_doc["hashed_password"] = get_password_hash(str(uuid.uuid4()))

    await db.users.insert_one(user_doc)
    return await get_user_by_username(user_data["username"])


async def authenticate_user(username: str, password: str):
    user = await get_user_by_username(username)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user


async def update_followed_topics(user_id: str, topic_ids: list):
    result = await db.users.update_one(
        {"id": user_id}, {"$set": {"followed_topics": topic_ids}}
    )
    return result.modified_count > 0


async def add_followed_topic(user_id: str, topic_id: str):
    result = await db.users.update_one(
        {"id": user_id}, {"$addToSet": {"followed_topics": topic_id}}
    )
    return result.modified_count > 0


async def remove_followed_topic(user_id: str, topic_id: str):
    result = await db.users.update_one(
        {"id": user_id}, {"$pull": {"followed_topics": topic_id}}
    )
    return result.modified_count > 0


async def update_user(user_id: str, user_update: dict):
    """
    Update user fields.

    Filters out None values to avoid overwriting fields that were not provided.
    Note: Boolean False values are preserved and will be updated correctly.
    This allows users to explicitly set newsletter_subscribed to False to unsubscribe.
    """
    # Filter out None values to avoid overwriting with nulls if not provided
    # Note: False is not None, so boolean False values are preserved
    update_data = {k: v for k, v in user_update.items() if v is not None}
    if not update_data:
        return False

    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    return result.modified_count > 0


async def get_user_by_id(user_id: str):
    return await db.users.find_one({"id": user_id})
