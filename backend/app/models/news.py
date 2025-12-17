from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List, Any
from datetime import datetime


class FacebookStats(BaseModel):
    model_config = ConfigDict(extra='ignore')

    likes: int = 0
    comments: int = 0
    shares: int = 0


class VKStats(BaseModel):
    model_config = ConfigDict(extra='ignore')

    shares: int = 0


class SocialStats(BaseModel):
    model_config = ConfigDict(extra='ignore')

    updated: Optional[str] = None
    facebook: Optional[FacebookStats] = None
    vk: Optional[VKStats] = None


class Thread(BaseModel):
    model_config = ConfigDict(extra='ignore')

    uuid: str
    url: str
    site_full: str
    site: str
    site_section: Optional[str] = None
    site_categories: List[str] = []
    section_title: Optional[str] = None
    title: str
    title_full: str
    published: str
    replies_count: int = 0
    participants_count: int = 0
    site_type: str
    country: Optional[str] = None
    main_image: Optional[str] = None
    performance_score: int = 0
    domain_rank: Optional[int] = None
    domain_rank_updated: Optional[str] = None
    social: Optional[SocialStats] = None


class Entity(BaseModel):
    model_config = ConfigDict(extra='ignore')

    name: str
    sentiment: Optional[str] = None


class Entities(BaseModel):
    model_config = ConfigDict(extra='ignore')

    persons: List[Entity] = []
    organizations: List[Entity] = []
    locations: List[Entity] = []


class NewsPost(BaseModel):
    model_config = ConfigDict(extra='ignore')

    thread: Thread
    uuid: str
    url: str
    ord_in_thread: int
    parent_url: Optional[str] = None
    author: Optional[str] = None
    published: str
    title: str
    text: str
    highlightText: str = ""
    highlightTitle: str = ""
    highlightThreadTitle: str = ""
    language: str
    sentiment: Optional[str] = None
    categories: List[str] = []
    external_links: List[Any] = []
    external_images: List[Any] = []
    entities: Optional[Entities] = None
    rating: Optional[float] = None
    crawled: str
    updated: Optional[str] = None


class NewsResponse(BaseModel):
    model_config = ConfigDict(extra='ignore')

    posts: List[NewsPost]
    totalResults: int
    moreResultsAvailable: int
    next: Optional[str] = None
    requestsLeft: int
    warnings: Optional[str] = None


class NewsQueryParams(BaseModel):
    q: str = "news"
    ts: Optional[int] = None
    size: int = 10
