from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Comment(BaseModel):
    id: str
    article_id: str
    user_id: str
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None
