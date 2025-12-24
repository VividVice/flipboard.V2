from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Comment(BaseModel):
    id: str
    article_id: str
    user_id: str
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class MagazineComment(BaseModel):
    id: str
    magazine_id: str
    user_id: str
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None
