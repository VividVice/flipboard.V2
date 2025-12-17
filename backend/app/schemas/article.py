from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime

class ArticleBase(BaseModel):
    title: str
    excerpt: str
    content: str
    author: str
    publisher: str
    source_url: str
    image_url: Optional[str] = None
    published_at: datetime
    topics: List[str] = []

class ArticleCreate(ArticleBase):
    id: Optional[str] = None

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    source_url: Optional[str] = None
    image_url: Optional[str] = None
    published_at: Optional[datetime] = None
    topics: Optional[List[str]] = None

class Article(ArticleBase):
    id: str
    view_count: int
    like_count: int
    comment_count: int
    created_at: datetime
    liked: bool = False
    saved: bool = False

    class Config:
        from_attributes = True

class ArticleList(BaseModel):
    articles: List[Article]
    total: int
    skip: int
    limit: int
