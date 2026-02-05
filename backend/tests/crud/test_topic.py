from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.crud import topic as topic_crud
from app.schemas.topic import TopicCreate, TopicUpdate

pytestmark = pytest.mark.anyio


# ============================================================================
# get_topic_by_id Tests
# ============================================================================


@patch("app.crud.topic.db")
async def test_get_topic_by_id_found(mock_db, test_topic):
    # GIVEN a topic exists
    mock_db.topics = MagicMock()
    mock_db.topics.find_one = AsyncMock(return_value=test_topic)

    # WHEN get_topic_by_id is called
    result = await topic_crud.get_topic_by_id("test-topic-id-123")

    # THEN the topic is returned
    mock_db.topics.find_one.assert_awaited_with({"id": "test-topic-id-123"})
    assert result == test_topic


@patch("app.crud.topic.db")
async def test_get_topic_by_id_not_found(mock_db):
    # GIVEN no topic exists
    mock_db.topics = MagicMock()
    mock_db.topics.find_one = AsyncMock(return_value=None)

    # WHEN get_topic_by_id is called
    result = await topic_crud.get_topic_by_id("nonexistent-id")

    # THEN None is returned
    assert result is None


# ============================================================================
# get_topic_by_name Tests
# ============================================================================


@patch("app.crud.topic.db")
async def test_get_topic_by_name_found(mock_db, test_topic):
    # GIVEN a topic exists
    mock_db.topics = MagicMock()
    mock_db.topics.find_one = AsyncMock(return_value=test_topic)

    # WHEN get_topic_by_name is called
    result = await topic_crud.get_topic_by_name("Technology")

    # THEN the topic is returned
    mock_db.topics.find_one.assert_awaited_with({"name": "Technology"})
    assert result == test_topic


@patch("app.crud.topic.db")
async def test_get_topic_by_name_not_found(mock_db):
    # GIVEN no topic with that name
    mock_db.topics = MagicMock()
    mock_db.topics.find_one = AsyncMock(return_value=None)

    # WHEN get_topic_by_name is called
    result = await topic_crud.get_topic_by_name("Nonexistent")

    # THEN None is returned
    assert result is None


# ============================================================================
# get_topics Tests
# ============================================================================


@patch("app.crud.topic.db")
async def test_get_topics_basic(mock_db, test_topic, test_topic_2):
    # GIVEN topics exist
    mock_cursor = MagicMock()
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[test_topic, test_topic_2])
    mock_db.topics = MagicMock()
    mock_db.topics.find = MagicMock(return_value=mock_cursor)

    # WHEN get_topics is called
    result = await topic_crud.get_topics(skip=0, limit=100)

    # THEN topics are returned sorted by name
    mock_db.topics.find.assert_called_with({})
    mock_cursor.sort.assert_called_with("name", 1)
    assert len(result) == 2


@patch("app.crud.topic.db")
async def test_get_topics_with_search(mock_db, test_topic):
    # GIVEN topics exist
    mock_cursor = MagicMock()
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[test_topic])
    mock_db.topics = MagicMock()
    mock_db.topics.find = MagicMock(return_value=mock_cursor)

    # WHEN get_topics is called with search
    result = await topic_crud.get_topics(search="Tech")

    # THEN query includes search regex
    call_args = mock_db.topics.find.call_args[0][0]
    assert "name" in call_args
    assert call_args["name"]["$regex"] == "Tech"
    assert call_args["name"]["$options"] == "i"
    assert len(result) == 1


@patch("app.crud.topic.db")
async def test_get_topics_with_pagination(mock_db, test_topic):
    # GIVEN topics exist
    mock_cursor = MagicMock()
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[test_topic])
    mock_db.topics = MagicMock()
    mock_db.topics.find = MagicMock(return_value=mock_cursor)

    # WHEN get_topics is called with pagination
    await topic_crud.get_topics(skip=10, limit=5)

    # THEN pagination is applied
    mock_cursor.skip.assert_called_with(10)
    mock_cursor.limit.assert_called_with(5)


# ============================================================================
# get_topics_count Tests
# ============================================================================


@patch("app.crud.topic.db")
async def test_get_topics_count_basic(mock_db):
    # GIVEN topics exist
    mock_db.topics = MagicMock()
    mock_db.topics.count_documents = AsyncMock(return_value=25)

    # WHEN get_topics_count is called
    result = await topic_crud.get_topics_count()

    # THEN count is returned
    assert result == 25
    mock_db.topics.count_documents.assert_awaited_with({})


@patch("app.crud.topic.db")
async def test_get_topics_count_with_search(mock_db):
    # GIVEN topics matching search exist
    mock_db.topics = MagicMock()
    mock_db.topics.count_documents = AsyncMock(return_value=5)

    # WHEN get_topics_count is called with search
    result = await topic_crud.get_topics_count(search="Tech")

    # THEN filtered count is returned
    assert result == 5
    call_args = mock_db.topics.count_documents.call_args[0][0]
    assert call_args["name"]["$regex"] == "Tech"


# ============================================================================
# create_topic Tests
# ============================================================================


@patch("app.crud.topic.db")
async def test_create_topic(mock_db):
    # GIVEN topic data
    topic_in = TopicCreate(
        name="New Topic",
        description="A new topic",
        image_url="https://example.com/topic.jpg",
    )
    created_topic = {
        "id": "new-topic-id",
        "name": "New Topic",
        "description": "A new topic",
        "image_url": "https://example.com/topic.jpg",
        "follower_count": 0,
        "created_at": datetime.utcnow(),
    }
    mock_db.topics = MagicMock()
    mock_db.topics.insert_one = AsyncMock()
    mock_db.topics.find_one = AsyncMock(return_value=created_topic)

    # WHEN create_topic is called
    result = await topic_crud.create_topic(topic_in)

    # THEN topic is created with defaults
    mock_db.topics.insert_one.assert_awaited_once()
    insert_data = mock_db.topics.insert_one.call_args[0][0]
    assert insert_data["name"] == "New Topic"
    assert insert_data["follower_count"] == 0
    assert "id" in insert_data
    assert "created_at" in insert_data
    assert result == created_topic


# ============================================================================
# update_topic Tests
# ============================================================================


@patch("app.crud.topic.db")
async def test_update_topic(mock_db, test_topic):
    # GIVEN a topic to update
    update_data = TopicUpdate(name="Updated Topic", description="Updated description")
    updated_topic = {**test_topic, "name": "Updated Topic"}
    mock_db.topics = MagicMock()
    mock_db.topics.update_one = AsyncMock()
    mock_db.topics.find_one = AsyncMock(return_value=updated_topic)

    # WHEN update_topic is called
    result = await topic_crud.update_topic("test-topic-id-123", update_data)

    # THEN topic is updated
    mock_db.topics.update_one.assert_awaited_once()
    call_args = mock_db.topics.update_one.call_args
    assert call_args[0][0] == {"id": "test-topic-id-123"}
    assert result["name"] == "Updated Topic"


@patch("app.crud.topic.db")
async def test_update_topic_filters_none(mock_db, test_topic):
    # GIVEN update with None values
    update_data = TopicUpdate(name="Updated", description=None)
    mock_db.topics = MagicMock()
    mock_db.topics.update_one = AsyncMock()
    mock_db.topics.find_one = AsyncMock(return_value=test_topic)

    # WHEN update_topic is called
    await topic_crud.update_topic("test-topic-id-123", update_data)

    # THEN None values are filtered
    call_args = mock_db.topics.update_one.call_args
    update_set = call_args[0][1]["$set"]
    assert "name" in update_set
    assert "description" not in update_set or update_set.get("description") is not None


# ============================================================================
# delete_topic Tests
# ============================================================================


@patch("app.crud.topic.db")
async def test_delete_topic_success(mock_db):
    # GIVEN a topic exists
    mock_result = MagicMock()
    mock_result.deleted_count = 1
    mock_db.topics = MagicMock()
    mock_db.topics.delete_one = AsyncMock(return_value=mock_result)

    # WHEN delete_topic is called
    result = await topic_crud.delete_topic("test-topic-id-123")

    # THEN True is returned
    mock_db.topics.delete_one.assert_awaited_with({"id": "test-topic-id-123"})
    assert result is True


@patch("app.crud.topic.db")
async def test_delete_topic_not_found(mock_db):
    # GIVEN no topic exists
    mock_result = MagicMock()
    mock_result.deleted_count = 0
    mock_db.topics = MagicMock()
    mock_db.topics.delete_one = AsyncMock(return_value=mock_result)

    # WHEN delete_topic is called
    result = await topic_crud.delete_topic("nonexistent-id")

    # THEN False is returned
    assert result is False


# ============================================================================
# increment_follower_count Tests
# ============================================================================


@patch("app.crud.topic.db")
async def test_increment_follower_count(mock_db):
    # GIVEN a topic
    mock_db.topics = MagicMock()
    mock_db.topics.update_one = AsyncMock()

    # WHEN increment_follower_count is called
    await topic_crud.increment_follower_count("test-topic-id-123", increment=1)

    # THEN follower_count is incremented
    mock_db.topics.update_one.assert_awaited_with(
        {"id": "test-topic-id-123"}, {"$inc": {"follower_count": 1}}
    )


@patch("app.crud.topic.db")
async def test_decrement_follower_count(mock_db):
    # GIVEN a topic
    mock_db.topics = MagicMock()
    mock_db.topics.update_one = AsyncMock()

    # WHEN increment_follower_count is called with negative value
    await topic_crud.increment_follower_count("test-topic-id-123", increment=-1)

    # THEN follower_count is decremented
    mock_db.topics.update_one.assert_awaited_with(
        {"id": "test-topic-id-123"}, {"$inc": {"follower_count": -1}}
    )


# ============================================================================
# get_topics_by_ids Tests
# ============================================================================


@patch("app.crud.topic.db")
async def test_get_topics_by_ids(mock_db, test_topic, test_topic_2):
    # GIVEN topics with IDs
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[test_topic, test_topic_2])
    mock_db.topics = MagicMock()
    mock_db.topics.find = MagicMock(return_value=mock_cursor)

    # WHEN get_topics_by_ids is called
    ids = ["test-topic-id-123", "test-topic-id-456"]
    result = await topic_crud.get_topics_by_ids(ids)

    # THEN topics are returned
    call_args = mock_db.topics.find.call_args[0][0]
    assert call_args == {"id": {"$in": ids}}
    assert len(result) == 2


@patch("app.crud.topic.db")
async def test_get_topics_by_ids_empty(mock_db):
    # GIVEN empty list
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_db.topics = MagicMock()
    mock_db.topics.find = MagicMock(return_value=mock_cursor)

    # WHEN get_topics_by_ids is called with empty list
    result = await topic_crud.get_topics_by_ids([])

    # THEN empty list is returned
    assert result == []
