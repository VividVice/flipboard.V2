from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserInteraction(BaseModel):
    id: str
    user_id: str
    article_id: str
    is_liked: bool = False
    is_saved: bool = False
    liked_at: Optional[datetime] = None
    saved_at: Optional[datetime] = None
