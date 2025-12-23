from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Magazine(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    article_ids: List[str] = []
    created_at: datetime
    updated_at: datetime
