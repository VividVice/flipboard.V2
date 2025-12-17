from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Topic(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    follower_count: int = 0
    created_at: datetime
