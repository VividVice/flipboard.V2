from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional
from datetime import datetime
import uuid

class User(BaseModel):
    id: uuid.UUID
    username: str
    email: EmailStr
    hashed_password: str
    bio: Optional[str] = None
    profile_pic: Optional[HttpUrl] = None
    created_at: datetime
