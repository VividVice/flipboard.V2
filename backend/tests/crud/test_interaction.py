from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.crud import interaction as interaction_crud

pytestmark = pytest.mark.anyio


# ============================================================================
# get_interaction Tests
# ============================================================================


@patch("app.crud.interaction.db")
async def test_get_interaction_found(mock_db, test_interaction):
    # GIVEN an interaction exists
    mock_db.user_interactions = MagicMock()
    mock_db.user_interactions.find_one = AsyncMock(return_value=test_interaction)

    # WHEN get_interaction is called
    result = await interaction_crud.get_interaction("test-user-id-123", "test-article-id-123")

    # THEN the interaction is returned
    mock_db.user_interactions.find_one.assert_awaited_with(
        {"user_id": "test-user-id-123", "article_id": "test-article-id-123"}
    )
    assert result == test_interaction


@patch("app.crud.interaction.db")
async def test_get_interaction_not_found(mock_db):
    # GIVEN no interaction exists
    mock_db.user_interactions = MagicMock()
    mock_db.user_interactions.find_one = AsyncMock(return_value=None)

    # WHEN get_interaction is called
    result = await interaction_crud.get_interaction("user-id", "article-id")

    # THEN None is returned
    assert result is None


# ============================================================================
# toggle_like Tests
# ============================================================================


@patch("app.crud.interaction.db")
async def test_toggle_like_new_interaction(mock_db):
    # GIVEN no existing interaction
    new_interaction = {
        "id": "new-interaction-id",
        "user_id": "test-user-id",
        "article_id": "test-article-id",
        "is_liked": True,
        "is_saved": False,
        "liked_at": datetime.utcnow(),
        "saved_at": None,
    }
    mock_db.user_interactions = MagicMock()
    mock_db.user_interactions.find_one = AsyncMock(side_effect=[None, new_interaction])
    mock_db.user_interactions.insert_one = AsyncMock()

    # WHEN toggle_like is called
    result, increment = await interaction_crud.toggle_like("test-user-id", "test-article-id")

    # THEN a new interaction is created with is_liked=True
    mock_db.user_interactions.insert_one.assert_awaited_once()
    insert_data = mock_db.user_interactions.insert_one.call_args[0][0]
    assert insert_data["is_liked"] is True
    assert insert_data["is_saved"] is False
    assert increment == 1


@patch("app.crud.interaction.db")
async def test_toggle_like_already_liked(mock_db):
    # GIVEN an existing liked interaction
    existing_interaction = {
        "id": "interaction-id",
        "user_id": "test-user-id",
        "article_id": "test-article-id",
        "is_liked": True,
        "is_saved": False,
    }
    updated_interaction = {**existing_interaction, "is_liked": False}
    mock_db.user_interactions = MagicMock()
    mock_db.user_interactions.find_one = AsyncMock(
        side_effect=[existing_interaction, updated_interaction]
    )
    mock_db.user_interactions.update_one = AsyncMock()

    # WHEN toggle_like is called
    result, increment = await interaction_crud.toggle_like("test-user-id", "test-article-id")

    # THEN like is toggled off
    mock_db.user_interactions.update_one.assert_awaited_once()
    call_args = mock_db.user_interactions.update_one.call_args
    assert call_args[0][1]["$set"]["is_liked"] is False
    assert increment == -1


@patch("app.crud.interaction.db")
async def test_toggle_like_not_liked(mock_db):
    # GIVEN an existing interaction that is not liked
    existing_interaction = {
        "id": "interaction-id",
        "user_id": "test-user-id",
        "article_id": "test-article-id",
        "is_liked": False,
        "is_saved": True,
    }
    updated_interaction = {**existing_interaction, "is_liked": True}
    mock_db.user_interactions = MagicMock()
    mock_db.user_interactions.find_one = AsyncMock(
        side_effect=[existing_interaction, updated_interaction]
    )
    mock_db.user_interactions.update_one = AsyncMock()

    # WHEN toggle_like is called
    result, increment = await interaction_crud.toggle_like("test-user-id", "test-article-id")

    # THEN like is toggled on
    call_args = mock_db.user_interactions.update_one.call_args
    assert call_args[0][1]["$set"]["is_liked"] is True
    assert increment == 1


# ============================================================================
# toggle_save Tests
# ============================================================================


@patch("app.crud.interaction.db")
async def test_toggle_save_new_interaction(mock_db):
    # GIVEN no existing interaction
    new_interaction = {
        "id": "new-interaction-id",
        "user_id": "test-user-id",
        "article_id": "test-article-id",
        "is_liked": False,
        "is_saved": True,
        "liked_at": None,
        "saved_at": datetime.utcnow(),
    }
    mock_db.user_interactions = MagicMock()
    mock_db.user_interactions.find_one = AsyncMock(side_effect=[None, new_interaction])
    mock_db.user_interactions.insert_one = AsyncMock()

    # WHEN toggle_save is called
    result = await interaction_crud.toggle_save("test-user-id", "test-article-id")

    # THEN a new interaction is created with is_saved=True
    mock_db.user_interactions.insert_one.assert_awaited_once()
    insert_data = mock_db.user_interactions.insert_one.call_args[0][0]
    assert insert_data["is_saved"] is True
    assert insert_data["is_liked"] is False


@patch("app.crud.interaction.db")
async def test_toggle_save_already_saved(mock_db):
    # GIVEN an existing saved interaction
    existing_interaction = {
        "id": "interaction-id",
        "user_id": "test-user-id",
        "article_id": "test-article-id",
        "is_liked": False,
        "is_saved": True,
    }
    updated_interaction = {**existing_interaction, "is_saved": False}
    mock_db.user_interactions = MagicMock()
    mock_db.user_interactions.find_one = AsyncMock(
        side_effect=[existing_interaction, updated_interaction]
    )
    mock_db.user_interactions.update_one = AsyncMock()

    # WHEN toggle_save is called
    result = await interaction_crud.toggle_save("test-user-id", "test-article-id")

    # THEN save is toggled off
    mock_db.user_interactions.update_one.assert_awaited_once()
    call_args = mock_db.user_interactions.update_one.call_args
    assert call_args[0][1]["$set"]["is_saved"] is False


@patch("app.crud.interaction.db")
async def test_toggle_save_not_saved(mock_db):
    # GIVEN an existing interaction that is not saved
    existing_interaction = {
        "id": "interaction-id",
        "user_id": "test-user-id",
        "article_id": "test-article-id",
        "is_liked": True,
        "is_saved": False,
    }
    updated_interaction = {**existing_interaction, "is_saved": True}
    mock_db.user_interactions = MagicMock()
    mock_db.user_interactions.find_one = AsyncMock(
        side_effect=[existing_interaction, updated_interaction]
    )
    mock_db.user_interactions.update_one = AsyncMock()

    # WHEN toggle_save is called
    result = await interaction_crud.toggle_save("test-user-id", "test-article-id")

    # THEN save is toggled on
    call_args = mock_db.user_interactions.update_one.call_args
    assert call_args[0][1]["$set"]["is_saved"] is True


# ============================================================================
# get_user_liked_articles Tests
# ============================================================================


@patch("app.crud.interaction.db")
async def test_get_user_liked_articles(mock_db, test_article):
    # GIVEN user has liked articles
    liked_interaction = {
        "user_id": "test-user-id",
        "article_id": "test-article-id-123",
        "is_liked": True,
    }
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[liked_interaction])

    mock_articles_cursor = MagicMock()
    mock_articles_cursor.to_list = AsyncMock(return_value=[test_article])

    mock_db.user_interactions = MagicMock()
    mock_db.user_interactions.find = MagicMock(return_value=mock_cursor)
    mock_db.articles = MagicMock()
    mock_db.articles.find = MagicMock(return_value=mock_articles_cursor)

    # WHEN get_user_liked_articles is called
    result = await interaction_crud.get_user_liked_articles("test-user-id")

    # THEN liked articles are returned
    mock_db.user_interactions.find.assert_called_with(
        {"user_id": "test-user-id", "is_liked": True}
    )
    assert len(result) == 1


@patch("app.crud.interaction.db")
async def test_get_user_liked_articles_empty(mock_db):
    # GIVEN user has no liked articles
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[])

    mock_db.user_interactions = MagicMock()
    mock_db.user_interactions.find = MagicMock(return_value=mock_cursor)

    # WHEN get_user_liked_articles is called
    result = await interaction_crud.get_user_liked_articles("test-user-id")

    # THEN empty list is returned
    assert result == []


# ============================================================================
# get_user_saved_articles Tests
# ============================================================================


@patch("app.crud.interaction.db")
async def test_get_user_saved_articles(mock_db, test_article):
    # GIVEN user has saved articles
    saved_interaction = {
        "user_id": "test-user-id",
        "article_id": "test-article-id-123",
        "is_saved": True,
    }
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[saved_interaction])

    mock_articles_cursor = MagicMock()
    mock_articles_cursor.to_list = AsyncMock(return_value=[test_article])

    mock_db.user_interactions = MagicMock()
    mock_db.user_interactions.find = MagicMock(return_value=mock_cursor)
    mock_db.articles = MagicMock()
    mock_db.articles.find = MagicMock(return_value=mock_articles_cursor)

    # WHEN get_user_saved_articles is called
    result = await interaction_crud.get_user_saved_articles("test-user-id")

    # THEN saved articles are returned
    mock_db.user_interactions.find.assert_called_with(
        {"user_id": "test-user-id", "is_saved": True}
    )
    assert len(result) == 1


@patch("app.crud.interaction.db")
async def test_get_user_saved_articles_empty(mock_db):
    # GIVEN user has no saved articles
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[])

    mock_db.user_interactions = MagicMock()
    mock_db.user_interactions.find = MagicMock(return_value=mock_cursor)

    # WHEN get_user_saved_articles is called
    result = await interaction_crud.get_user_saved_articles("test-user-id")

    # THEN empty list is returned
    assert result == []


# ============================================================================
# get_user_interactions_for_articles Tests
# ============================================================================


@patch("app.crud.interaction.db")
async def test_get_user_interactions_for_articles(mock_db):
    # GIVEN user has interactions with some articles
    interactions = [
        {"article_id": "article-1", "is_liked": True, "is_saved": False},
        {"article_id": "article-2", "is_liked": False, "is_saved": True},
    ]
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=interactions)
    mock_db.user_interactions = MagicMock()
    mock_db.user_interactions.find = MagicMock(return_value=mock_cursor)

    # WHEN get_user_interactions_for_articles is called
    article_ids = ["article-1", "article-2", "article-3"]
    result = await interaction_crud.get_user_interactions_for_articles(
        "test-user-id", article_ids
    )

    # THEN interactions are returned with defaults for missing
    assert result["article-1"]["is_liked"] is True
    assert result["article-1"]["is_saved"] is False
    assert result["article-2"]["is_liked"] is False
    assert result["article-2"]["is_saved"] is True
    assert result["article-3"]["is_liked"] is False
    assert result["article-3"]["is_saved"] is False


@patch("app.crud.interaction.db")
async def test_get_user_interactions_for_articles_no_interactions(mock_db):
    # GIVEN user has no interactions
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_db.user_interactions = MagicMock()
    mock_db.user_interactions.find = MagicMock(return_value=mock_cursor)

    # WHEN get_user_interactions_for_articles is called
    article_ids = ["article-1", "article-2"]
    result = await interaction_crud.get_user_interactions_for_articles(
        "test-user-id", article_ids
    )

    # THEN all articles have default values
    assert result["article-1"] == {"is_liked": False, "is_saved": False}
    assert result["article-2"] == {"is_liked": False, "is_saved": False}
