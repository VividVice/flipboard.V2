from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
