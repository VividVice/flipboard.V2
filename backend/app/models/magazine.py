from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class Magazine(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    article_ids: List[str] = []
    created_at: datetime
    updated_at: datetime
