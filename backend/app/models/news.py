from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, field_validator


class FacebookStats(BaseModel):
    model_config = ConfigDict(extra="ignore")

    likes: int = 0
    comments: int = 0
    shares: int = 0


class VKStats(BaseModel):
    model_config = ConfigDict(extra="ignore")

    shares: int = 0


class SocialStats(BaseModel):
    model_config = ConfigDict(extra="ignore")

    updated: Optional[str] = None
    facebook: Optional[FacebookStats] = None
    vk: Optional[VKStats] = None


class Thread(BaseModel):
    model_config = ConfigDict(extra="ignore")

    uuid: str = ""
    url: str = ""
    site_full: str = ""
    site: str = ""
    site_section: Optional[str] = None
    site_categories: List[str] = []
    section_title: Optional[str] = None
    title: str = ""
    title_full: str = ""
    published: str = ""
    replies_count: int = 0
    participants_count: int = 0
    site_type: str = "news"
    country: Optional[str] = None
    main_image: Optional[str] = None
    performance_score: int = 0
    domain_rank: Optional[int] = None
    domain_rank_updated: Optional[str] = None
    social: Optional[SocialStats] = None

    @field_validator("site_categories", mode="before")
    @classmethod
    def ensure_list(cls, v: Any) -> List[str]:
        if v is None:
            return []
        return v


class Entity(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = ""
    sentiment: Optional[str] = None


class Entities(BaseModel):
    model_config = ConfigDict(extra="ignore")

    persons: List[Entity] = []
    organizations: List[Entity] = []
    locations: List[Entity] = []


class NewsPost(BaseModel):
    model_config = ConfigDict(extra="ignore")

    thread: Optional[Thread] = None
    uuid: str = ""
    url: str = ""
    ord_in_thread: int = 0
    parent_url: Optional[str] = None
    author: Optional[str] = None
    published: str = ""
    title: str = ""
    text: str = ""
    highlightText: str = ""
    highlightTitle: str = ""
    highlightThreadTitle: str = ""
    language: str = ""
    sentiment: Optional[str] = None
    categories: List[str] = []
    external_links: List[Any] = []
    external_images: List[Any] = []
    entities: Optional[Entities] = None
    rating: Optional[float] = None
    crawled: str = ""
    updated: Optional[str] = None
    liked: bool = False
    saved: bool = False

    @field_validator("categories", "external_links", "external_images", mode="before")
    @classmethod
    def ensure_lists(cls, v: Any) -> List[Any]:
        if v is None:
            return []
        return v


class NewsResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    posts: List[NewsPost] = []
    totalResults: int = 0
    moreResultsAvailable: int = 0
    next: Optional[str] = None
    requestsLeft: int = 0
    warnings: Optional[str] = None


class NewsQueryParams(BaseModel):
    q: str = "news"
    ts: Optional[int] = None
    size: int = 10
    country: Optional[str] = None
