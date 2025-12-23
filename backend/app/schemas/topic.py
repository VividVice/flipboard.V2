from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TopicBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None


class TopicCreate(TopicBase):
    pass


class TopicUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None


class TopicBulkFollow(BaseModel):
    topic_ids: list[str]


class Topic(TopicBase):
    id: str
    follower_count: int
    created_at: datetime

    class Config:
        from_attributes = True
