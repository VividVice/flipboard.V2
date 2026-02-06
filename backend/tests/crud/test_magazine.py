from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.crud import magazine as magazine_crud
from app.schemas.magazine import MagazineCreate, MagazineUpdate

pytestmark = pytest.mark.anyio


# ============================================================================
# create_magazine Tests
# ============================================================================


@patch("app.crud.magazine.db")
async def test_create_magazine(mock_db, test_user):
    # GIVEN magazine data
    magazine_in = MagazineCreate(
        name="New Magazine",
        description="A test magazine",
        is_public=True,
    )
    created_magazine = {
        "id": "new-magazine-id",
        "name": "New Magazine",
        "description": "A test magazine",
        "user_id": test_user["id"],
        "article_ids": [],
        "is_public": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    mock_db.magazines = MagicMock()
    mock_db.magazines.insert_one = AsyncMock()
    mock_db.magazines.find_one = AsyncMock(return_value=created_magazine)

    # WHEN create_magazine is called
    result = await magazine_crud.create_magazine(test_user["id"], magazine_in)

    # THEN magazine is created with defaults
    mock_db.magazines.insert_one.assert_awaited_once()
    insert_data = mock_db.magazines.insert_one.call_args[0][0]
    assert insert_data["name"] == "New Magazine"
    assert insert_data["user_id"] == test_user["id"]
    assert insert_data["article_ids"] == []
    assert "id" in insert_data
    assert "created_at" in insert_data
    assert result == created_magazine


# ============================================================================
# get_magazine_by_id Tests
# ============================================================================


@patch("app.crud.magazine.db")
async def test_get_magazine_by_id_found(mock_db, test_magazine):
    # GIVEN a magazine exists
    mock_db.magazines = MagicMock()
    mock_db.magazines.find_one = AsyncMock(return_value=test_magazine)

    # WHEN get_magazine_by_id is called
    result = await magazine_crud.get_magazine_by_id("test-magazine-id-123")

    # THEN the magazine is returned
    mock_db.magazines.find_one.assert_awaited_with({"id": "test-magazine-id-123"})
    assert result == test_magazine


@patch("app.crud.magazine.db")
async def test_get_magazine_by_id_not_found(mock_db):
    # GIVEN no magazine exists
    mock_db.magazines = MagicMock()
    mock_db.magazines.find_one = AsyncMock(return_value=None)

    # WHEN get_magazine_by_id is called
    result = await magazine_crud.get_magazine_by_id("nonexistent-id")

    # THEN None is returned
    assert result is None


# ============================================================================
# get_user_magazines Tests
# ============================================================================


@patch("app.crud.magazine.db")
async def test_get_user_magazines(mock_db, test_magazine):
    # GIVEN user has magazines
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[test_magazine])
    mock_db.magazines = MagicMock()
    mock_db.magazines.find = MagicMock(return_value=mock_cursor)

    # WHEN get_user_magazines is called
    result = await magazine_crud.get_user_magazines("test-user-id-123")

    # THEN user's magazines are returned
    mock_db.magazines.find.assert_called_with({"user_id": "test-user-id-123"})
    mock_cursor.sort.assert_called_with("updated_at", -1)
    assert len(result) == 1


@patch("app.crud.magazine.db")
async def test_get_user_magazines_empty(mock_db):
    # GIVEN user has no magazines
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_db.magazines = MagicMock()
    mock_db.magazines.find = MagicMock(return_value=mock_cursor)

    # WHEN get_user_magazines is called
    result = await magazine_crud.get_user_magazines("test-user-id-123")

    # THEN empty list is returned
    assert result == []


# ============================================================================
# update_magazine Tests
# ============================================================================


@patch("app.crud.magazine.db")
async def test_update_magazine(mock_db):
    # GIVEN a magazine to update
    update_data = MagazineUpdate(name="Updated Name", description="Updated description")
    mock_result = MagicMock()
    mock_result.modified_count = 1
    mock_db.magazines = MagicMock()
    mock_db.magazines.update_one = AsyncMock(return_value=mock_result)

    # WHEN update_magazine is called
    result = await magazine_crud.update_magazine("test-magazine-id-123", update_data)

    # THEN True is returned
    mock_db.magazines.update_one.assert_awaited_once()
    call_args = mock_db.magazines.update_one.call_args
    assert call_args[0][0] == {"id": "test-magazine-id-123"}
    assert "updated_at" in call_args[0][1]["$set"]
    assert result is True


@patch("app.crud.magazine.db")
async def test_update_magazine_no_changes(mock_db):
    # GIVEN update with only None values
    update_data = MagazineUpdate(name=None, description=None)
    mock_db.magazines = MagicMock()

    # WHEN update_magazine is called
    result = await magazine_crud.update_magazine("test-magazine-id-123", update_data)

    # THEN False is returned without database call
    assert result is False


@patch("app.crud.magazine.db")
async def test_update_magazine_not_found(mock_db):
    # GIVEN magazine doesn't exist
    update_data = MagazineUpdate(name="Updated Name")
    mock_result = MagicMock()
    mock_result.modified_count = 0
    mock_db.magazines = MagicMock()
    mock_db.magazines.update_one = AsyncMock(return_value=mock_result)

    # WHEN update_magazine is called
    result = await magazine_crud.update_magazine("nonexistent-id", update_data)

    # THEN False is returned
    assert result is False


# ============================================================================
# add_article_to_magazine Tests
# ============================================================================


@patch("app.crud.magazine.db")
async def test_add_article_to_magazine(mock_db):
    # GIVEN a magazine and article
    mock_result = MagicMock()
    mock_result.modified_count = 1
    mock_db.magazines = MagicMock()
    mock_db.magazines.update_one = AsyncMock(return_value=mock_result)

    # WHEN add_article_to_magazine is called
    result = await magazine_crud.add_article_to_magazine(
        "test-magazine-id-123", "test-article-id-123"
    )

    # THEN True is returned
    call_args = mock_db.magazines.update_one.call_args
    assert call_args[0][0] == {"id": "test-magazine-id-123"}
    assert "$addToSet" in call_args[0][1]
    assert call_args[0][1]["$addToSet"] == {"article_ids": "test-article-id-123"}
    assert result is True


@patch("app.crud.magazine.db")
async def test_add_article_to_magazine_already_exists(mock_db):
    # GIVEN article already in magazine
    mock_result = MagicMock()
    mock_result.modified_count = 0  # No modification because article already exists
    mock_db.magazines = MagicMock()
    mock_db.magazines.update_one = AsyncMock(return_value=mock_result)

    # WHEN add_article_to_magazine is called
    result = await magazine_crud.add_article_to_magazine(
        "test-magazine-id-123", "test-article-id-123"
    )

    # THEN False is returned
    assert result is False


# ============================================================================
# remove_article_from_magazine Tests
# ============================================================================


@patch("app.crud.magazine.db")
async def test_remove_article_from_magazine(mock_db):
    # GIVEN a magazine with article
    mock_result = MagicMock()
    mock_result.modified_count = 1
    mock_db.magazines = MagicMock()
    mock_db.magazines.update_one = AsyncMock(return_value=mock_result)

    # WHEN remove_article_from_magazine is called
    result = await magazine_crud.remove_article_from_magazine(
        "test-magazine-id-123", "test-article-id-123"
    )

    # THEN True is returned
    call_args = mock_db.magazines.update_one.call_args
    assert call_args[0][0] == {"id": "test-magazine-id-123"}
    assert "$pull" in call_args[0][1]
    assert call_args[0][1]["$pull"] == {"article_ids": "test-article-id-123"}
    assert result is True


@patch("app.crud.magazine.db")
async def test_remove_article_from_magazine_not_in_magazine(mock_db):
    # GIVEN article not in magazine
    mock_result = MagicMock()
    mock_result.modified_count = 0
    mock_db.magazines = MagicMock()
    mock_db.magazines.update_one = AsyncMock(return_value=mock_result)

    # WHEN remove_article_from_magazine is called
    result = await magazine_crud.remove_article_from_magazine(
        "test-magazine-id-123", "nonexistent-article-id"
    )

    # THEN False is returned
    assert result is False


# ============================================================================
# delete_magazine Tests
# ============================================================================


@patch("app.crud.magazine.db")
async def test_delete_magazine_success(mock_db):
    # GIVEN a magazine exists
    mock_result = MagicMock()
    mock_result.deleted_count = 1
    mock_db.magazines = MagicMock()
    mock_db.magazines.delete_one = AsyncMock(return_value=mock_result)

    # WHEN delete_magazine is called
    result = await magazine_crud.delete_magazine("test-magazine-id-123")

    # THEN True is returned
    mock_db.magazines.delete_one.assert_awaited_with({"id": "test-magazine-id-123"})
    assert result is True


@patch("app.crud.magazine.db")
async def test_delete_magazine_not_found(mock_db):
    # GIVEN no magazine exists
    mock_result = MagicMock()
    mock_result.deleted_count = 0
    mock_db.magazines = MagicMock()
    mock_db.magazines.delete_one = AsyncMock(return_value=mock_result)

    # WHEN delete_magazine is called
    result = await magazine_crud.delete_magazine("nonexistent-id")

    # THEN False is returned
    assert result is False
