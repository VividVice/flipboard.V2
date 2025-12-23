from app.db.database import db
from app.schemas.magazine import MagazineCreate, MagazineUpdate
from datetime import datetime
import uuid

async def create_magazine(user_id: str, magazine: MagazineCreate):
    magazine_doc = magazine.dict()
    magazine_doc["id"] = str(uuid.uuid4())
    magazine_doc["user_id"] = user_id
    magazine_doc["article_ids"] = []
    magazine_doc["created_at"] = datetime.utcnow()
    magazine_doc["updated_at"] = datetime.utcnow()
    
    await db.magazines.insert_one(magazine_doc)
    return await get_magazine_by_id(magazine_doc["id"])

async def get_magazine_by_id(magazine_id: str):
    return await db.magazines.find_one({"id": magazine_id})

async def get_user_magazines(user_id: str):
    cursor = db.magazines.find({"user_id": user_id}).sort("updated_at", -1)
    return await cursor.to_list(length=100)

async def update_magazine(magazine_id: str, magazine_update: MagazineUpdate):
    update_data = {k: v for k, v in magazine_update.dict().items() if v is not None}
    if not update_data:
        return False
    
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.magazines.update_one(
        {"id": magazine_id},
        {"$set": update_data}
    )
    return result.modified_count > 0

async def add_article_to_magazine(magazine_id: str, article_id: str):
    result = await db.magazines.update_one(
        {"id": magazine_id},
        {"$addToSet": {"article_ids": article_id}, "$set": {"updated_at": datetime.utcnow()}}
    )
    return result.modified_count > 0

async def remove_article_from_magazine(magazine_id: str, article_id: str):
    result = await db.magazines.update_one(
        {"id": magazine_id},
        {"$pull": {"article_ids": article_id}, "$set": {"updated_at": datetime.utcnow()}}
    )
    return result.modified_count > 0

async def delete_magazine(magazine_id: str):
    result = await db.magazines.delete_one({"id": magazine_id})
    return result.deleted_count > 0
