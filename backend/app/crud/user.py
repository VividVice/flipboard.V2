from app.db.database import db
from app.schemas.user import UserCreate
from app.models.user import User
from app.security.password import get_password_hash, verify_password
from datetime import datetime
import uuid

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

async def authenticate_user(username: str, password: str):
    user = await get_user_by_username(username)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

async def update_followed_topics(user_id: str, topic_ids: list):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"followed_topics": topic_ids}}
    )
    return result.modified_count > 0

async def add_followed_topic(user_id: str, topic_id: str):
    result = await db.users.update_one(
        {"id": user_id},
        {"$addToSet": {"followed_topics": topic_id}}
    )
    return result.modified_count > 0

async def remove_followed_topic(user_id: str, topic_id: str):
    result = await db.users.update_one(
        {"id": user_id},
        {"$pull": {"followed_topics": topic_id}}
    )
    return result.modified_count > 0

async def update_user(user_id: str, user_update: dict):
    # Filter out None values to avoid overwriting with nulls if not provided
    update_data = {k: v for k, v in user_update.items() if v is not None}
    if not update_data:
        return False
        
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    return result.modified_count > 0

async def get_user_by_id(user_id: str):
    return await db.users.find_one({"id": user_id})
