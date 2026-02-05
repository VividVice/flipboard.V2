"""
Shared pytest fixtures for backend tests.

This module provides common fixtures for:
- Mock MongoDB database
- Test user authentication
- HTTP client for route testing
"""

import os
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Set test environment variables before importing app modules
os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017")
os.environ.setdefault("MONGODB_DATABASE", "flipboard_test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-google-client-id")


# Mark all tests as anyio tests by default
def pytest_configure(config):
    config.addinivalue_line("markers", "anyio: mark test as async")


# ============================================================================
# Mock Database Fixtures
# ============================================================================


@pytest.fixture
def mock_db():
    """Create a mock MongoDB database with async methods."""
    db = MagicMock()

    # Users collection
    db.users = MagicMock()
    db.users.find_one = AsyncMock(return_value=None)
    db.users.insert_one = AsyncMock()
    db.users.update_one = AsyncMock()
    db.users.delete_one = AsyncMock()
    db.users.find = MagicMock(return_value=MagicMock())
    db.users.count_documents = AsyncMock(return_value=0)

    # Articles collection
    db.articles = MagicMock()
    db.articles.find_one = AsyncMock(return_value=None)
    db.articles.insert_one = AsyncMock()
    db.articles.update_one = AsyncMock()
    db.articles.delete_one = AsyncMock()
    db.articles.find = MagicMock(return_value=MagicMock())
    db.articles.count_documents = AsyncMock(return_value=0)

    # Comments collection
    db.comments = MagicMock()
    db.comments.find_one = AsyncMock(return_value=None)
    db.comments.insert_one = AsyncMock()
    db.comments.update_one = AsyncMock()
    db.comments.delete_one = AsyncMock()
    db.comments.find = MagicMock(return_value=MagicMock())
    db.comments.count_documents = AsyncMock(return_value=0)

    # Topics collection
    db.topics = MagicMock()
    db.topics.find_one = AsyncMock(return_value=None)
    db.topics.insert_one = AsyncMock()
    db.topics.update_one = AsyncMock()
    db.topics.delete_one = AsyncMock()
    db.topics.find = MagicMock(return_value=MagicMock())
    db.topics.count_documents = AsyncMock(return_value=0)

    # Magazines collection
    db.magazines = MagicMock()
    db.magazines.find_one = AsyncMock(return_value=None)
    db.magazines.insert_one = AsyncMock()
    db.magazines.update_one = AsyncMock()
    db.magazines.delete_one = AsyncMock()
    db.magazines.find = MagicMock(return_value=MagicMock())
    db.magazines.count_documents = AsyncMock(return_value=0)

    # Interactions collection
    db.user_interactions = MagicMock()
    db.user_interactions.find_one = AsyncMock(return_value=None)
    db.user_interactions.insert_one = AsyncMock()
    db.user_interactions.update_one = AsyncMock()
    db.user_interactions.delete_one = AsyncMock()
    db.user_interactions.find = MagicMock(return_value=MagicMock())
    db.user_interactions.count_documents = AsyncMock(return_value=0)

    return db


@pytest.fixture
def mock_cursor():
    """Create a mock async cursor for find operations."""

    def create_cursor(items: list):
        cursor = MagicMock()
        cursor.sort = MagicMock(return_value=cursor)
        cursor.skip = MagicMock(return_value=cursor)
        cursor.limit = MagicMock(return_value=cursor)
        cursor.to_list = AsyncMock(return_value=items)
        return cursor

    return create_cursor


# ============================================================================
# Test User Fixtures
# ============================================================================


@pytest.fixture
def test_user():
    """Create a test user dictionary."""
    return {
        "id": "12345678-1234-5678-1234-567812345678",
        "email": "test@example.com",
        "username": "testuser",
        "hashed_password": "$2b$12$test-hashed-password",
        "profile_pic": "https://example.com/avatar.png",
        "bio": "Test user bio",
        "followed_topics": [],
        "magazines": [],
        "followers": [],
        "following": [],
        "newsletter_subscribed": False,
        "created_at": datetime(2024, 1, 1, 0, 0, 0),
    }


@pytest.fixture
def test_user_2():
    """Create a second test user for relationship testing."""
    return {
        "id": "87654321-4321-8765-4321-876543218765",
        "email": "test2@example.com",
        "username": "testuser2",
        "hashed_password": "$2b$12$test-hashed-password-2",
        "profile_pic": None,
        "bio": "Second test user",
        "followed_topics": ["topic-1"],
        "magazines": [],
        "followers": [],
        "following": [],
        "newsletter_subscribed": True,
        "created_at": datetime(2024, 1, 2, 0, 0, 0),
    }


# ============================================================================
# Authentication Fixtures
# ============================================================================


@pytest.fixture
def auth_token(test_user):
    """Create a valid JWT token for the test user."""
    from app.security.token import create_access_token

    return create_access_token(data={"sub": test_user["id"]})


@pytest.fixture
def auth_headers(auth_token):
    """Create authorization headers with Bearer token."""
    return {"Authorization": f"Bearer {auth_token}"}


# ============================================================================
# Test Article Fixtures
# ============================================================================


@pytest.fixture
def test_article():
    """Create a test article dictionary."""
    return {
        "id": "test-article-id-123",
        "title": "Test Article Title",
        "excerpt": "This is a test article excerpt.",
        "content": "Full content of the test article.",
        "author": "Test Author",
        "publisher": "Test Publisher",
        "source_url": "https://example.com/article",
        "image_url": "https://example.com/image.jpg",
        "topics": ["technology", "programming"],
        "view_count": 100,
        "like_count": 10,
        "comment_count": 5,
        "published_at": datetime(2024, 1, 15, 12, 0, 0),
        "created_at": datetime(2024, 1, 15, 12, 0, 0),
    }


@pytest.fixture
def test_article_2():
    """Create a second test article."""
    return {
        "id": "test-article-id-456",
        "title": "Second Test Article",
        "excerpt": "Another test article excerpt.",
        "content": "Content of the second article.",
        "author": "Another Author",
        "publisher": "Another Publisher",
        "source_url": "https://example.com/article2",
        "image_url": None,
        "topics": ["science"],
        "view_count": 50,
        "like_count": 5,
        "comment_count": 2,
        "published_at": datetime(2024, 1, 16, 12, 0, 0),
        "created_at": datetime(2024, 1, 16, 12, 0, 0),
    }


# ============================================================================
# Test Comment Fixtures
# ============================================================================


@pytest.fixture
def test_comment(test_user, test_article):
    """Create a test comment dictionary."""
    return {
        "id": "test-comment-id-123",
        "content": "This is a test comment.",
        "article_id": test_article["id"],
        "user_id": test_user["id"],
        "created_at": datetime(2024, 1, 15, 14, 0, 0),
        "updated_at": None,
    }


@pytest.fixture
def test_comment_with_user(test_comment, test_user):
    """Create a test comment with user info attached."""
    comment = test_comment.copy()
    comment["user"] = {
        "id": test_user["id"],
        "username": test_user["username"],
        "profile_pic": test_user["profile_pic"],
    }
    return comment


# ============================================================================
# Test Topic Fixtures
# ============================================================================


@pytest.fixture
def test_topic():
    """Create a test topic dictionary."""
    return {
        "id": "test-topic-id-123",
        "name": "Technology",
        "description": "All about technology",
        "image_url": "https://example.com/tech.jpg",
        "follower_count": 1000,
        "created_at": datetime(2024, 1, 1, 0, 0, 0),
    }


@pytest.fixture
def test_topic_2():
    """Create a second test topic."""
    return {
        "id": "test-topic-id-456",
        "name": "Science",
        "description": "Scientific discoveries",
        "image_url": None,
        "follower_count": 500,
        "created_at": datetime(2024, 1, 2, 0, 0, 0),
    }


# ============================================================================
# Test Magazine Fixtures
# ============================================================================


@pytest.fixture
def test_magazine(test_user):
    """Create a test magazine dictionary."""
    return {
        "id": "test-magazine-id-123",
        "name": "My Test Magazine",
        "description": "A test magazine for testing",
        "cover_image": "https://example.com/cover.jpg",
        "user_id": test_user["id"],
        "article_ids": [],
        "is_public": True,
        "created_at": datetime(2024, 1, 10, 0, 0, 0),
        "updated_at": datetime(2024, 1, 10, 0, 0, 0),
    }


@pytest.fixture
def test_magazine_with_articles(test_magazine, test_article, test_article_2):
    """Create a test magazine with articles."""
    magazine = test_magazine.copy()
    magazine["article_ids"] = [test_article["id"], test_article_2["id"]]
    return magazine


# ============================================================================
# Test Interaction Fixtures
# ============================================================================


@pytest.fixture
def test_interaction(test_user, test_article):
    """Create a test interaction dictionary."""
    return {
        "id": "test-interaction-id-123",
        "user_id": test_user["id"],
        "article_id": test_article["id"],
        "is_liked": True,
        "is_saved": False,
        "liked_at": datetime(2024, 1, 15, 15, 0, 0),
        "saved_at": None,
    }


# ============================================================================
# HTTP Client Fixtures for Route Testing
# ============================================================================


@pytest.fixture
def app():
    """Create FastAPI test application instance."""
    from app.main import app

    return app


@pytest.fixture
async def async_client(app):
    """Create async HTTP client for testing routes."""
    from httpx import ASGITransport, AsyncClient

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client


# ============================================================================
# Database Patch Helpers
# ============================================================================


@pytest.fixture
def patch_db(mock_db):
    """Patch the database module with mock_db."""
    with patch("app.db.database.db", mock_db):
        yield mock_db


@pytest.fixture
def patch_article_crud_db(mock_db):
    """Patch the db in article CRUD module."""
    with patch("app.crud.article.db", mock_db):
        yield mock_db


@pytest.fixture
def patch_comment_crud_db(mock_db):
    """Patch the db in comment CRUD module."""
    with patch("app.crud.comment.db", mock_db):
        yield mock_db


@pytest.fixture
def patch_topic_crud_db(mock_db):
    """Patch the db in topic CRUD module."""
    with patch("app.crud.topic.db", mock_db):
        yield mock_db


@pytest.fixture
def patch_magazine_crud_db(mock_db):
    """Patch the db in magazine CRUD module."""
    with patch("app.crud.magazine.db", mock_db):
        yield mock_db


@pytest.fixture
def patch_interaction_crud_db(mock_db):
    """Patch the db in interaction CRUD module."""
    with patch("app.crud.interaction.db", mock_db):
        yield mock_db


@pytest.fixture
def patch_user_crud_db(mock_db):
    """Patch the db in user CRUD module."""
    with patch("app.crud.user.db", mock_db):
        yield mock_db
