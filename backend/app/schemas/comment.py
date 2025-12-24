from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    pass


class CommentUpdate(BaseModel):
    content: str


class Comment(CommentBase):
    id: str
    article_id: Optional[str] = None
    magazine_id: Optional[str] = None
    user_id: str
    article_title: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CommentWithUser(Comment):
    user: Dict[str, Any]


class MagazineComment(CommentBase):
    id: str
    magazine_id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MagazineCommentWithUser(MagazineComment):
    user: Dict[str, Any]
