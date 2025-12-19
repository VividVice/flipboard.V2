from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, List
from datetime import datetime
import uuid

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
