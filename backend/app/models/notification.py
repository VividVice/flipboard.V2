from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class Notification(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    magazine_id: Optional[str] = None
    article_id: Optional[str] = None
    message: str
    read: bool = False
    created_at: datetime

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "60d0fe4f9e1a6c001f3e7a8e",
                "user_id": "user123",
                "magazine_id": "magazine456",
                "article_id": "article789",
                "message": "New article 'Python in 2024' added to 'My Magazine'",
                "read": False,
                "created_at": "2024-01-01T12:00:00Z",
            }
        }
