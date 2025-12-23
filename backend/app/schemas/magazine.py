from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MagazineBase(BaseModel):
    name: str
    description: Optional[str] = None

class MagazineCreate(MagazineBase):
    pass

class MagazineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Magazine(MagazineBase):
    id: str
    user_id: str
    article_ids: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
