from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Topic(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    follower_count: int = 0
    created_at: datetime
