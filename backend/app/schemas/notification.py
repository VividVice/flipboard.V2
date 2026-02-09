from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NotificationBase(BaseModel):
    user_id: str
    magazine_id: Optional[str] = None
    article_id: Optional[str] = None
    message: str
    read: bool = False


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    read: bool


class Notification(NotificationBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
