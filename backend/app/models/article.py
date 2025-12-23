from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class Article(BaseModel):
    id: str
    title: str
    excerpt: str
    content: str
    author: str
    publisher: str
    source_url: str
    image_url: Optional[str] = None
    published_at: datetime
    topics: List[str] = []
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    created_at: datetime
