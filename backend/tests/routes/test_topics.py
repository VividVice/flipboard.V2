from unittest.mock import AsyncMock, patch

import pytest
from fastapi import status
from httpx import ASGITransport, AsyncClient

pytestmark = pytest.mark.anyio


@pytest.fixture
def app():
    from app.main import app

    return app


# ============================================================================
# GET /topics/ Tests
# ============================================================================


@patch("app.routes.topics.topic_crud")
async def test_get_topics(mock_topic_crud, app, test_topic, test_topic_2):
    # GIVEN topics exist
    mock_topic_crud.get_topics = AsyncMock(return_value=[test_topic, test_topic_2])

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get topics is called
        response = await client.get("/topics/")

    # THEN topics are returned
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2


@patch("app.routes.topics.topic_crud")
async def test_get_topics_with_search(mock_topic_crud, app, test_topic):
    # GIVEN search term provided
    mock_topic_crud.get_topics = AsyncMock(return_value=[test_topic])

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get topics with search is called
        response = await client.get("/topics/", params={"search": "Tech"})

    # THEN filtered topics are returned
    assert response.status_code == status.HTTP_200_OK
    mock_topic_crud.get_topics.assert_awaited_with(skip=0, limit=100, search="Tech")


@patch("app.routes.topics.topic_crud")
async def test_get_topics_with_pagination(mock_topic_crud, app):
    # GIVEN pagination params
    mock_topic_crud.get_topics = AsyncMock(return_value=[])

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get topics with pagination is called
        response = await client.get("/topics/", params={"skip": 10, "limit": 5})

    # THEN pagination is applied
    assert response.status_code == status.HTTP_200_OK
    mock_topic_crud.get_topics.assert_awaited_with(skip=10, limit=5, search=None)


# ============================================================================
# GET /topics/{topic_id} Tests
# ============================================================================


@patch("app.routes.topics.topic_crud")
async def test_get_topic(mock_topic_crud, app, test_topic):
    # GIVEN topic exists
    mock_topic_crud.get_topic_by_id = AsyncMock(return_value=test_topic)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get topic is called
        response = await client.get(f"/topics/{test_topic['id']}")

    # THEN topic is returned
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["id"] == test_topic["id"]


@patch("app.routes.topics.topic_crud")
async def test_get_topic_not_found(mock_topic_crud, app):
    # GIVEN topic doesn't exist
    mock_topic_crud.get_topic_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get topic is called
        response = await client.get("/topics/nonexistent")

    # THEN 404 is returned
    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# POST /topics/ Tests
# ============================================================================


@patch("app.routes.topics.topic_crud")
async def test_create_topic(mock_topic_crud, app, test_topic):
    # GIVEN topic doesn't exist
    mock_topic_crud.get_topic_by_name = AsyncMock(return_value=None)
    mock_topic_crud.create_topic = AsyncMock(return_value=test_topic)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN create topic is called
        response = await client.post(
            "/topics/", json={"name": "Technology", "description": "Tech topics"}
        )

    # THEN topic is created
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["name"] == test_topic["name"]


@patch("app.routes.topics.topic_crud")
async def test_create_topic_already_exists(mock_topic_crud, app, test_topic):
    # GIVEN topic name already exists
    mock_topic_crud.get_topic_by_name = AsyncMock(return_value=test_topic)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN create topic is called
        response = await client.post(
            "/topics/", json={"name": "Technology", "description": "Tech topics"}
        )

    # THEN error is returned
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in response.json()["detail"]


# ============================================================================
# POST /topics/bulk-follow Tests
# ============================================================================


@patch("app.routes.topics.topic_crud")
@patch("app.routes.topics.user_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_bulk_follow_topics(
    mock_verify,
    mock_get_user,
    mock_user_crud,
    mock_topic_crud,
    app,
    test_user,
    test_topic,
    test_topic_2,
):
    # GIVEN authenticated user and topics exist
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    third_topic = {**test_topic, "id": "topic-3", "name": "Third Topic"}
    mock_topic_crud.get_topic_by_id = AsyncMock(
        side_effect=[test_topic, test_topic_2, third_topic]
    )
    mock_user_crud.update_followed_topics = AsyncMock()
    mock_topic_crud.increment_follower_count = AsyncMock()

    topic_ids = [test_topic["id"], test_topic_2["id"], third_topic["id"]]

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN bulk follow is called with 3 topics
        response = await client.post(
            "/topics/bulk-follow",
            json={"topic_ids": topic_ids},
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN topics are followed
    assert response.status_code == status.HTTP_200_OK
    mock_user_crud.update_followed_topics.assert_awaited_once()


@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_bulk_follow_topics_minimum_required(
    mock_verify, mock_get_user, app, test_user, test_topic
):
    # GIVEN less than 3 topics
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN bulk follow is called with only 2 topics
        response = await client.post(
            "/topics/bulk-follow",
            json={"topic_ids": ["topic-1", "topic-2"]},
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN error is returned
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Minimum 3 topics" in response.json()["detail"]


@patch("app.routes.topics.topic_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_bulk_follow_topics_topic_not_found(
    mock_verify, mock_get_user, mock_topic_crud, app, test_user, test_topic
):
    # GIVEN one topic doesn't exist
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_topic_crud.get_topic_by_id = AsyncMock(side_effect=[test_topic, None])

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN bulk follow is called
        response = await client.post(
            "/topics/bulk-follow",
            json={"topic_ids": [test_topic["id"], "nonexistent", "third"]},
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN 404 is returned
    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# POST /topics/{topic_id}/follow Tests
# ============================================================================


@patch("app.routes.topics.topic_crud")
@patch("app.routes.topics.user_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_toggle_follow_topic_follow(
    mock_verify,
    mock_get_user,
    mock_user_crud,
    mock_topic_crud,
    app,
    test_user,
    test_topic,
):
    # GIVEN user not following topic
    user_without_topic = {**test_user, "followed_topics": []}
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = user_without_topic
    mock_topic_crud.get_topic_by_id = AsyncMock(return_value=test_topic)
    mock_user_crud.add_followed_topic = AsyncMock()
    mock_topic_crud.increment_follower_count = AsyncMock()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN toggle follow is called
        response = await client.post(
            f"/topics/{test_topic['id']}/follow",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN topic is followed
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["is_following"] is True
    mock_user_crud.add_followed_topic.assert_awaited_once()
    mock_topic_crud.increment_follower_count.assert_awaited_with(test_topic["id"], 1)


@patch("app.routes.topics.topic_crud")
@patch("app.routes.topics.user_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_toggle_follow_topic_unfollow(
    mock_verify,
    mock_get_user,
    mock_user_crud,
    mock_topic_crud,
    app,
    test_user,
    test_topic,
):
    # GIVEN user already following topic
    user_with_topic = {**test_user, "followed_topics": [test_topic["id"]]}
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = user_with_topic
    mock_topic_crud.get_topic_by_id = AsyncMock(return_value=test_topic)
    mock_user_crud.remove_followed_topic = AsyncMock()
    mock_topic_crud.increment_follower_count = AsyncMock()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN toggle follow is called
        response = await client.post(
            f"/topics/{test_topic['id']}/follow",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN topic is unfollowed
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["is_following"] is False
    mock_user_crud.remove_followed_topic.assert_awaited_once()
    mock_topic_crud.increment_follower_count.assert_awaited_with(test_topic["id"], -1)


@patch("app.routes.topics.topic_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_toggle_follow_topic_not_found(
    mock_verify, mock_get_user, mock_topic_crud, app, test_user
):
    # GIVEN topic doesn't exist
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user
    mock_topic_crud.get_topic_by_id = AsyncMock(return_value=None)

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN toggle follow is called
        response = await client.post(
            "/topics/nonexistent/follow",
            headers={"Authorization": "Bearer valid-token"},
        )

    # THEN 404 is returned
    assert response.status_code == status.HTTP_404_NOT_FOUND


# ============================================================================
# GET /topics/me/followed Tests
# ============================================================================


@patch("app.routes.topics.topic_crud")
@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_user_followed_topics(
    mock_verify, mock_get_user, mock_topic_crud, app, test_user, test_topic
):
    # GIVEN user has followed topics
    user_with_topics = {**test_user, "followed_topics": [test_topic["id"]]}
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = user_with_topics
    mock_topic_crud.get_topics_by_ids = AsyncMock(return_value=[test_topic])

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get followed topics is called
        response = await client.get(
            "/topics/me/followed", headers={"Authorization": "Bearer valid-token"}
        )

    # THEN followed topics are returned
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1


@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_user_followed_topics_empty(
    mock_verify, mock_get_user, app, test_user
):
    # GIVEN user has no followed topics
    user_without_topics = {**test_user, "followed_topics": []}
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = user_without_topics

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # WHEN get followed topics is called
        response = await client.get(
            "/topics/me/followed", headers={"Authorization": "Bearer valid-token"}
        )

    # THEN empty list is returned
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []
