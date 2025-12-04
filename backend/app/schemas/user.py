from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional
from datetime import datetime
import uuid

class UserBase(BaseModel):
    email: EmailStr
    username: str
    bio: Optional[str] = None
    profile_pic: Optional[HttpUrl] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None
    profile_pic: Optional[HttpUrl] = None

class UserInDBBase(UserBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str
