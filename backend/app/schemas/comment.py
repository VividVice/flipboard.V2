from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: str

class Comment(CommentBase):
    id: str
    article_id: str
    user_id: str
    article_title: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CommentWithUser(Comment):
    user: Dict[str, Any]
