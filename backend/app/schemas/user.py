import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, HttpUrl


class UserBase(BaseModel):
    email: EmailStr
    username: str
    bio: Optional[str] = None
    profile_pic: Optional[HttpUrl] = None
    followed_topics: List[str] = []
    newsletter_subscribed: bool = False


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    """
    Schema for updating user information.

    All fields are optional to allow partial updates. When updating via the API,
    only provided fields will be updated. Note that boolean fields like
    newsletter_subscribed can be explicitly set to False to disable the feature.
    """

    username: Optional[str] = None
    bio: Optional[str] = None
    profile_pic: Optional[HttpUrl] = None
    followed_topics: Optional[List[str]] = None
    newsletter_subscribed: Optional[bool] = None


class UserInDBBase(UserBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    hashed_password: str
