from datetime import datetime

from app.models.article import Article
from app.models.comment import Comment, MagazineComment
from app.models.interaction import UserInteraction
from app.models.magazine import Magazine
from app.models.news import (
    Entities,
    Entity,
    FacebookStats,
    NewsPost,
    NewsQueryParams,
    NewsResponse,
    SocialStats,
    Thread,
    VKStats,
)
from app.models.topic import Topic
from app.models.user import User

# ============================================================================
# Article Model Tests
# ============================================================================


def test_article_model():
    article = Article(
        id="a1",
        title="Title",
        excerpt="Excerpt",
        content="Content",
        author="Author",
        publisher="Publisher",
        source_url="https://example.com",
        published_at=datetime(2024, 1, 1),
        created_at=datetime(2024, 1, 1),
    )
    assert article.id == "a1"
    assert article.image_url is None
    assert article.topics == []
    assert article.view_count == 0
    assert article.like_count == 0
    assert article.comment_count == 0


def test_article_model_with_optionals():
    article = Article(
        id="a1",
        title="Title",
        excerpt="Excerpt",
        content="Content",
        author="Author",
        publisher="Publisher",
        source_url="https://example.com",
        image_url="https://example.com/img.jpg",
        published_at=datetime(2024, 1, 1),
        topics=["tech"],
        view_count=10,
        like_count=5,
        comment_count=2,
        created_at=datetime(2024, 1, 1),
    )
    assert article.image_url == "https://example.com/img.jpg"
    assert article.topics == ["tech"]
    assert article.view_count == 10


# ============================================================================
# Comment Model Tests
# ============================================================================


def test_comment_model():
    comment = Comment(
        id="c1",
        article_id="a1",
        user_id="u1",
        content="Nice article",
        created_at=datetime(2024, 1, 1),
    )
    assert comment.id == "c1"
    assert comment.updated_at is None


def test_comment_model_with_updated_at():
    comment = Comment(
        id="c1",
        article_id="a1",
        user_id="u1",
        content="Updated",
        created_at=datetime(2024, 1, 1),
        updated_at=datetime(2024, 1, 2),
    )
    assert comment.updated_at == datetime(2024, 1, 2)


def test_magazine_comment_model():
    comment = MagazineComment(
        id="mc1",
        magazine_id="m1",
        user_id="u1",
        content="Great magazine",
        created_at=datetime(2024, 1, 1),
    )
    assert comment.magazine_id == "m1"
    assert comment.updated_at is None


# ============================================================================
# Interaction Model Tests
# ============================================================================


def test_user_interaction_model_defaults():
    interaction = UserInteraction(
        id="i1",
        user_id="u1",
        article_id="a1",
    )
    assert interaction.is_liked is False
    assert interaction.is_saved is False
    assert interaction.liked_at is None
    assert interaction.saved_at is None


def test_user_interaction_model_full():
    now = datetime(2024, 1, 1)
    interaction = UserInteraction(
        id="i1",
        user_id="u1",
        article_id="a1",
        is_liked=True,
        is_saved=True,
        liked_at=now,
        saved_at=now,
    )
    assert interaction.is_liked is True
    assert interaction.is_saved is True
    assert interaction.liked_at == now


# ============================================================================
# Magazine Model Tests
# ============================================================================


def test_magazine_model():
    magazine = Magazine(
        id="m1",
        user_id="u1",
        name="My Magazine",
        created_at=datetime(2024, 1, 1),
        updated_at=datetime(2024, 1, 1),
    )
    assert magazine.description is None
    assert magazine.article_ids == []


def test_magazine_model_with_articles():
    magazine = Magazine(
        id="m1",
        user_id="u1",
        name="My Magazine",
        description="A desc",
        article_ids=["a1", "a2"],
        created_at=datetime(2024, 1, 1),
        updated_at=datetime(2024, 1, 1),
    )
    assert len(magazine.article_ids) == 2


# ============================================================================
# Topic Model Tests
# ============================================================================


def test_topic_model():
    topic = Topic(
        id="t1",
        name="Technology",
        created_at=datetime(2024, 1, 1),
    )
    assert topic.description is None
    assert topic.icon is None
    assert topic.follower_count == 0


def test_topic_model_full():
    topic = Topic(
        id="t1",
        name="Technology",
        description="Tech news",
        icon="laptop",
        follower_count=100,
        created_at=datetime(2024, 1, 1),
    )
    assert topic.icon == "laptop"
    assert topic.follower_count == 100


# ============================================================================
# User Model Tests
# ============================================================================


def test_user_model():
    user = User(
        id="12345678-1234-5678-1234-567812345678",
        username="testuser",
        email="test@example.com",
        hashed_password="hashed",
        created_at=datetime(2024, 1, 1),
    )
    assert user.bio is None
    assert user.profile_pic is None
    assert user.followed_topics == []
    assert user.followers == []
    assert user.following == []
    assert user.followed_magazines == []
    assert user.newsletter_subscribed is False


def test_user_model_full():
    user = User(
        id="12345678-1234-5678-1234-567812345678",
        username="testuser",
        email="test@example.com",
        hashed_password="hashed",
        bio="My bio",
        profile_pic="https://example.com/pic.jpg",
        followed_topics=["t1"],
        followers=["u2"],
        following=["u3"],
        followed_magazines=["m1"],
        newsletter_subscribed=True,
        created_at=datetime(2024, 1, 1),
    )
    assert user.newsletter_subscribed is True
    assert len(user.followers) == 1


# ============================================================================
# News Model Tests - Validators
# ============================================================================


def test_facebook_stats_defaults():
    stats = FacebookStats()
    assert stats.likes == 0
    assert stats.comments == 0
    assert stats.shares == 0


def test_facebook_stats_extra_ignored():
    stats = FacebookStats(likes=10, unknown_field="ignored")
    assert stats.likes == 10


def test_vk_stats():
    stats = VKStats(shares=5)
    assert stats.shares == 5


def test_social_stats():
    stats = SocialStats(
        updated="2024-01-01",
        facebook=FacebookStats(likes=10),
        vk=VKStats(shares=5),
    )
    assert stats.facebook.likes == 10
    assert stats.vk.shares == 5


def test_social_stats_defaults():
    stats = SocialStats()
    assert stats.updated is None
    assert stats.facebook is None
    assert stats.vk is None


def test_thread_defaults():
    thread = Thread()
    assert thread.uuid == ""
    assert thread.url == ""
    assert thread.site_categories == []
    assert thread.site_type == "news"
    assert thread.performance_score == 0


def test_thread_site_categories_validator_none():
    thread = Thread(site_categories=None)
    assert thread.site_categories == []


def test_thread_site_categories_validator_list():
    thread = Thread(site_categories=["news", "tech"])
    assert thread.site_categories == ["news", "tech"]


def test_entity():
    entity = Entity(name="Test", sentiment="positive")
    assert entity.name == "Test"
    assert entity.sentiment == "positive"


def test_entity_defaults():
    entity = Entity()
    assert entity.name == ""
    assert entity.sentiment is None


def test_entities():
    entities = Entities(
        persons=[Entity(name="John")],
        organizations=[Entity(name="Corp")],
        locations=[Entity(name="NYC")],
    )
    assert len(entities.persons) == 1
    assert len(entities.organizations) == 1
    assert len(entities.locations) == 1


def test_entities_defaults():
    entities = Entities()
    assert entities.persons == []
    assert entities.organizations == []
    assert entities.locations == []


def test_news_post_defaults():
    post = NewsPost()
    assert post.uuid == ""
    assert post.categories == []
    assert post.external_links == []
    assert post.external_images == []
    assert post.liked is False
    assert post.saved is False


def test_news_post_ensure_lists_validator_none():
    post = NewsPost(categories=None, external_links=None, external_images=None)
    assert post.categories == []
    assert post.external_links == []
    assert post.external_images == []


def test_news_post_ensure_lists_validator_values():
    post = NewsPost(
        categories=["tech"],
        external_links=["http://a.com"],
        external_images=["http://b.com/img.jpg"],
    )
    assert post.categories == ["tech"]
    assert post.external_links == ["http://a.com"]
    assert post.external_images == ["http://b.com/img.jpg"]


def test_news_post_full():
    post = NewsPost(
        thread=Thread(uuid="t1", url="http://example.com"),
        uuid="p1",
        url="http://example.com/article",
        author="Author",
        title="Title",
        text="Text",
        language="en",
        sentiment="positive",
        entities=Entities(persons=[Entity(name="John")]),
    )
    assert post.thread.uuid == "t1"
    assert post.entities.persons[0].name == "John"


def test_news_response_defaults():
    response = NewsResponse()
    assert response.posts == []
    assert response.totalResults == 0
    assert response.moreResultsAvailable == 0
    assert response.next is None
    assert response.requestsLeft == 0
    assert response.warnings is None


def test_news_response_with_posts():
    response = NewsResponse(
        posts=[NewsPost(uuid="p1", title="Test")],
        totalResults=1,
        moreResultsAvailable=0,
        requestsLeft=99,
    )
    assert len(response.posts) == 1
    assert response.totalResults == 1


def test_news_query_params_defaults():
    params = NewsQueryParams()
    assert params.q == "news"
    assert params.ts is None
    assert params.size == 10
    assert params.country is None


def test_news_query_params_custom():
    params = NewsQueryParams(q="bitcoin", ts=1234567890, size=5, country="US")
    assert params.q == "bitcoin"
    assert params.ts == 1234567890
    assert params.size == 5
    assert params.country == "US"
