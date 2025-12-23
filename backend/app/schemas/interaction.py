from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class InteractionBase(BaseModel):
    is_liked: bool = False
    is_saved: bool = False


class Interaction(InteractionBase):
    id: str
    user_id: str
    article_id: str
    liked_at: Optional[datetime] = None
    saved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InteractionStatus(BaseModel):
    article_id: str
    is_liked: bool
    is_saved: bool
