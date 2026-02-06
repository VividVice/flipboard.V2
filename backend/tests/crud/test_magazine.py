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
# get_all_magazines Tests
# ============================================================================


@patch("app.crud.magazine.db")
async def test_get_all_magazines_basic(mock_db, test_magazine):
    # GIVEN multiple magazines exist
    magazine_2 = test_magazine.copy()
    magazine_2["id"] = "test-magazine-id-456"
    magazine_2["user_id"] = "another-user-id"
    magazine_2["updated_at"] = datetime(2024, 1, 11, 0, 0, 0)

    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[magazine_2, test_magazine])
    mock_db.magazines = MagicMock()
    mock_db.magazines.find = MagicMock(return_value=mock_cursor)

    # WHEN get_all_magazines is called without exclude_user_id
    result = await magazine_crud.get_all_magazines()

    # THEN all magazines are returned
    mock_db.magazines.find.assert_called_with({})
    mock_cursor.sort.assert_called_with("updated_at", -1)
    mock_cursor.skip.assert_called_with(0)
    mock_cursor.limit.assert_called_with(100)
    assert len(result) == 2


@patch("app.crud.magazine.db")
async def test_get_all_magazines_with_exclude_user(mock_db, test_magazine):
    # GIVEN multiple magazines exist
    magazine_2 = test_magazine.copy()
    magazine_2["id"] = "test-magazine-id-456"
    magazine_2["user_id"] = "another-user-id"

    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[magazine_2])
    mock_db.magazines = MagicMock()
    mock_db.magazines.find = MagicMock(return_value=mock_cursor)

    # WHEN get_all_magazines is called with exclude_user_id
    result = await magazine_crud.get_all_magazines(
        exclude_user_id=test_magazine["user_id"]
    )

    # THEN only magazines not belonging to excluded user are returned
    mock_db.magazines.find.assert_called_with(
        {"user_id": {"$ne": test_magazine["user_id"]}}
    )
    mock_cursor.sort.assert_called_with("updated_at", -1)
    assert len(result) == 1
    assert result[0]["user_id"] == "another-user-id"


@patch("app.crud.magazine.db")
async def test_get_all_magazines_pagination(mock_db, test_magazine):
    # GIVEN pagination parameters
    skip_value = 10
    limit_value = 5

    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[test_magazine])
    mock_db.magazines = MagicMock()
    mock_db.magazines.find = MagicMock(return_value=mock_cursor)

    # WHEN get_all_magazines is called with skip and limit
    result = await magazine_crud.get_all_magazines(skip=skip_value, limit=limit_value)

    # THEN pagination parameters are applied correctly
    mock_cursor.skip.assert_called_with(skip_value)
    mock_cursor.limit.assert_called_with(limit_value)
    mock_cursor.to_list.assert_awaited_with(length=limit_value)
    assert len(result) == 1


@patch("app.crud.magazine.db")
async def test_get_all_magazines_empty(mock_db):
    # GIVEN no magazines exist
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_db.magazines = MagicMock()
    mock_db.magazines.find = MagicMock(return_value=mock_cursor)

    # WHEN get_all_magazines is called
    result = await magazine_crud.get_all_magazines()

    # THEN empty list is returned
    assert result == []
    mock_db.magazines.find.assert_called_with({})


@patch("app.crud.magazine.db")
async def test_get_all_magazines_sorting(mock_db, test_magazine):
    # GIVEN multiple magazines with different updated_at timestamps
    magazine_1 = test_magazine.copy()
    magazine_1["id"] = "magazine-1"
    magazine_1["updated_at"] = datetime(2024, 1, 10, 0, 0, 0)

    magazine_2 = test_magazine.copy()
    magazine_2["id"] = "magazine-2"
    magazine_2["updated_at"] = datetime(2024, 1, 12, 0, 0, 0)

    magazine_3 = test_magazine.copy()
    magazine_3["id"] = "magazine-3"
    magazine_3["updated_at"] = datetime(2024, 1, 11, 0, 0, 0)

    # Sorted by updated_at descending
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[magazine_2, magazine_3, magazine_1])
    mock_db.magazines = MagicMock()
    mock_db.magazines.find = MagicMock(return_value=mock_cursor)

    # WHEN get_all_magazines is called
    result = await magazine_crud.get_all_magazines()

    # THEN results are sorted by updated_at in descending order
    mock_cursor.sort.assert_called_with("updated_at", -1)
    assert len(result) == 3
    # Verify order: most recently updated first
    assert result[0]["updated_at"] > result[1]["updated_at"]
    assert result[1]["updated_at"] > result[2]["updated_at"]


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
