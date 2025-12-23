import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, HttpUrl


class User(BaseModel):
    id: uuid.UUID
    username: str
    email: EmailStr
    hashed_password: str
    bio: Optional[str] = None
    profile_pic: Optional[HttpUrl] = None
    followed_topics: List[str] = []
    newsletter_subscribed: bool = False
    created_at: datetime
