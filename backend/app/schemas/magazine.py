from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class MagazineBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None


class MagazineCreate(MagazineBase):
    pass


class MagazineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None


class Magazine(MagazineBase):
    id: str
    user_id: str
    article_ids: List[str] = []
    cover_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
