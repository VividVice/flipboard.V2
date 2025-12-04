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
