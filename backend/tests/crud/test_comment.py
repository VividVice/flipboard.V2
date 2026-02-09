from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.crud import comment as comment_crud
from app.schemas.comment import CommentCreate, CommentUpdate

pytestmark = pytest.mark.anyio


# ============================================================================
# get_comment_by_id Tests
# ============================================================================


@patch("app.crud.comment.db")
async def test_get_comment_by_id_found(mock_db, test_comment):
    # GIVEN a comment exists
    mock_db.comments = MagicMock()
    mock_db.comments.find_one = AsyncMock(return_value=test_comment)

    # WHEN get_comment_by_id is called
    result = await comment_crud.get_comment_by_id("test-comment-id-123")

    # THEN the comment is returned
    mock_db.comments.find_one.assert_awaited_with({"id": "test-comment-id-123"})
    assert result == test_comment


@patch("app.crud.comment.db")
async def test_get_comment_by_id_not_found(mock_db):
    # GIVEN no comment exists
    mock_db.comments = MagicMock()
    mock_db.comments.find_one = AsyncMock(return_value=None)

    # WHEN get_comment_by_id is called
    result = await comment_crud.get_comment_by_id("nonexistent-id")

    # THEN None is returned
    assert result is None


# ============================================================================
# get_comments_by_article Tests
# ============================================================================


@patch("app.crud.comment.user_crud")
@patch("app.crud.comment.db")
async def test_get_comments_by_article(
    mock_db, mock_user_crud, test_comment, test_user
):
    # GIVEN comments exist for an article
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[test_comment])
    mock_db.comments = MagicMock()
    mock_db.comments.find = MagicMock(return_value=mock_cursor)

    mock_user_crud.get_user_by_id = AsyncMock(return_value=test_user)

    # WHEN get_comments_by_article is called
    result = await comment_crud.get_comments_by_article("test-article-id-123")

    # THEN comments with user info are returned
    mock_db.comments.find.assert_called_with({"article_id": "test-article-id-123"})
    assert len(result) == 1
    assert result[0]["user"]["username"] == test_user["username"]


@patch("app.crud.comment.user_crud")
@patch("app.crud.comment.db")
async def test_get_comments_by_article_user_not_found(
    mock_db, mock_user_crud, test_comment
):
    # GIVEN comments exist but user doesn't
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[test_comment])
    mock_db.comments = MagicMock()
    mock_db.comments.find = MagicMock(return_value=mock_cursor)

    mock_user_crud.get_user_by_id = AsyncMock(return_value=None)

    # WHEN get_comments_by_article is called
    result = await comment_crud.get_comments_by_article("test-article-id-123")

    # THEN comments have fallback user info
    assert len(result) == 1
    assert result[0]["user"]["username"] == "Unknown User"


# ============================================================================
# get_comments_count Tests
# ============================================================================


@patch("app.crud.comment.db")
async def test_get_comments_count(mock_db):
    # GIVEN comments exist
    mock_db.comments = MagicMock()
    mock_db.comments.count_documents = AsyncMock(return_value=5)

    # WHEN get_comments_count is called
    result = await comment_crud.get_comments_count("test-article-id-123")

    # THEN count is returned
    assert result == 5
    mock_db.comments.count_documents.assert_awaited_with(
        {"article_id": "test-article-id-123"}
    )


# ============================================================================
# get_comments_by_magazine Tests
# ============================================================================


@patch("app.crud.comment.user_crud")
@patch("app.crud.comment.db")
async def test_get_comments_by_magazine(mock_db, mock_user_crud, test_user):
    # GIVEN magazine comments exist
    magazine_comment = {
        "id": "magazine-comment-id",
        "content": "Magazine comment",
        "magazine_id": "test-magazine-id",
        "user_id": test_user["id"],
        "created_at": datetime.utcnow(),
    }
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[magazine_comment])
    mock_db.comments = MagicMock()
    mock_db.comments.find = MagicMock(return_value=mock_cursor)

    mock_user_crud.get_user_by_id = AsyncMock(return_value=test_user)

    # WHEN get_comments_by_magazine is called
    result = await comment_crud.get_comments_by_magazine("test-magazine-id")

    # THEN comments are returned
    mock_db.comments.find.assert_called_with({"magazine_id": "test-magazine-id"})
    assert len(result) == 1


# ============================================================================
# get_magazine_comments_count Tests
# ============================================================================


@patch("app.crud.comment.db")
async def test_get_magazine_comments_count(mock_db):
    # GIVEN magazine comments exist
    mock_db.comments = MagicMock()
    mock_db.comments.count_documents = AsyncMock(return_value=3)

    # WHEN get_magazine_comments_count is called
    result = await comment_crud.get_magazine_comments_count("test-magazine-id")

    # THEN count is returned
    assert result == 3


# ============================================================================
# get_comments_by_user Tests
# ============================================================================


@patch("app.crud.comment.user_crud")
@patch("app.crud.comment.db")
async def test_get_comments_by_user_with_article(mock_db, mock_user_crud, test_user):
    # GIVEN user has comments on articles
    user_comment = {
        "id": "user-comment-id",
        "content": "User comment",
        "article_id": "test-article-id",
        "user_id": test_user["id"],
        "created_at": datetime.utcnow(),
    }
    article = {"id": "test-article-id", "title": "Test Article"}

    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[user_comment])
    mock_db.comments = MagicMock()
    mock_db.comments.find = MagicMock(return_value=mock_cursor)
    mock_db.articles = MagicMock()
    mock_db.articles.find_one = AsyncMock(return_value=article)

    mock_user_crud.get_user_by_id = AsyncMock(return_value=test_user)

    # WHEN get_comments_by_user is called
    result = await comment_crud.get_comments_by_user(test_user["id"])

    # THEN comments with article title are returned
    assert len(result) == 1
    assert result[0]["article_title"] == "Test Article"


@patch("app.crud.comment.user_crud")
@patch("app.crud.comment.db")
async def test_get_comments_by_user_with_magazine(mock_db, mock_user_crud, test_user):
    # GIVEN user has comments on magazines
    user_comment = {
        "id": "user-comment-id",
        "content": "User comment",
        "magazine_id": "test-magazine-id",
        "user_id": test_user["id"],
        "created_at": datetime.utcnow(),
    }
    magazine = {"id": "test-magazine-id", "name": "Test Magazine"}

    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[user_comment])
    mock_db.comments = MagicMock()
    mock_db.comments.find = MagicMock(return_value=mock_cursor)
    mock_db.magazines = MagicMock()
    mock_db.magazines.find_one = AsyncMock(return_value=magazine)

    mock_user_crud.get_user_by_id = AsyncMock(return_value=test_user)

    # WHEN get_comments_by_user is called
    result = await comment_crud.get_comments_by_user(test_user["id"])

    # THEN comments with magazine title are returned
    assert len(result) == 1
    assert result[0]["magazine_title"] == "Test Magazine"


@patch("app.crud.comment.user_crud")
@patch("app.crud.comment.db")
async def test_get_comments_by_user_deleted_article(mock_db, mock_user_crud, test_user):
    # GIVEN user has comments but article was deleted
    user_comment = {
        "id": "user-comment-id",
        "content": "User comment",
        "article_id": "deleted-article-id",
        "user_id": test_user["id"],
        "created_at": datetime.utcnow(),
    }

    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[user_comment])
    mock_db.comments = MagicMock()
    mock_db.comments.find = MagicMock(return_value=mock_cursor)
    mock_db.articles = MagicMock()
    mock_db.articles.find_one = AsyncMock(return_value=None)

    mock_user_crud.get_user_by_id = AsyncMock(return_value=test_user)

    # WHEN get_comments_by_user is called
    result = await comment_crud.get_comments_by_user(test_user["id"])

    # THEN comments show deleted article
    assert len(result) == 1
    assert result[0]["article_title"] == "Deleted Article"


# ============================================================================
# create_comment Tests
# ============================================================================


@patch("app.crud.comment.user_crud")
@patch("app.crud.comment.db")
async def test_create_comment(mock_db, mock_user_crud, test_user):
    # GIVEN comment data
    comment_in = CommentCreate(content="New comment")
    created_comment = {
        "id": "new-comment-id",
        "content": "New comment",
        "article_id": "test-article-id",
        "user_id": test_user["id"],
        "created_at": datetime.utcnow(),
        "updated_at": None,
    }
    mock_db.comments = MagicMock()
    mock_db.comments.insert_one = AsyncMock()
    mock_db.comments.find_one = AsyncMock(return_value=created_comment)

    mock_user_crud.get_user_by_id = AsyncMock(return_value=test_user)

    # WHEN create_comment is called
    result = await comment_crud.create_comment(
        "test-article-id", test_user["id"], comment_in
    )

    # THEN comment is created with user info
    mock_db.comments.insert_one.assert_awaited_once()
    assert result["content"] == "New comment"
    assert result["user"]["username"] == test_user["username"]


@patch("app.crud.comment.user_crud")
@patch("app.crud.comment.db")
async def test_create_comment_user_not_found(mock_db, mock_user_crud):
    # GIVEN comment data but user doesn't exist
    comment_in = CommentCreate(content="New comment")
    created_comment = {
        "id": "new-comment-id",
        "content": "New comment",
        "article_id": "test-article-id",
        "user_id": "unknown-user-id",
        "created_at": datetime.utcnow(),
        "updated_at": None,
    }
    mock_db.comments = MagicMock()
    mock_db.comments.insert_one = AsyncMock()
    mock_db.comments.find_one = AsyncMock(return_value=created_comment)

    mock_user_crud.get_user_by_id = AsyncMock(return_value=None)

    # WHEN create_comment is called
    result = await comment_crud.create_comment(
        "test-article-id", "unknown-user-id", comment_in
    )

    # THEN comment has fallback user info
    assert result["user"]["username"] == "Unknown User"


# ============================================================================
# create_magazine_comment Tests
# ============================================================================


@patch("app.crud.comment.user_crud")
@patch("app.crud.comment.db")
async def test_create_magazine_comment(mock_db, mock_user_crud, test_user):
    # GIVEN magazine comment data
    comment_in = CommentCreate(content="Magazine comment")
    created_comment = {
        "id": "new-magazine-comment-id",
        "content": "Magazine comment",
        "magazine_id": "test-magazine-id",
        "user_id": test_user["id"],
        "created_at": datetime.utcnow(),
        "updated_at": None,
    }
    mock_db.comments = MagicMock()
    mock_db.comments.insert_one = AsyncMock()
    mock_db.comments.find_one = AsyncMock(return_value=created_comment)

    mock_user_crud.get_user_by_id = AsyncMock(return_value=test_user)

    # WHEN create_magazine_comment is called
    result = await comment_crud.create_magazine_comment(
        "test-magazine-id", test_user["id"], comment_in
    )

    # THEN magazine comment is created
    mock_db.comments.insert_one.assert_awaited_once()
    insert_data = mock_db.comments.insert_one.call_args[0][0]
    assert "magazine_id" in insert_data
    assert insert_data["magazine_id"] == "test-magazine-id"
    assert result["user"]["username"] == test_user["username"]


# ============================================================================
# update_comment Tests
# ============================================================================


@patch("app.crud.comment.db")
async def test_update_comment(mock_db, test_comment):
    # GIVEN a comment to update
    update_data = CommentUpdate(content="Updated comment")
    updated_comment = {**test_comment, "content": "Updated comment"}
    mock_db.comments = MagicMock()
    mock_db.comments.update_one = AsyncMock()
    mock_db.comments.find_one = AsyncMock(return_value=updated_comment)

    # WHEN update_comment is called
    result = await comment_crud.update_comment("test-comment-id-123", update_data)

    # THEN comment is updated
    mock_db.comments.update_one.assert_awaited_once()
    call_args = mock_db.comments.update_one.call_args
    assert call_args[0][0] == {"id": "test-comment-id-123"}
    assert "updated_at" in call_args[0][1]["$set"]
    assert result["content"] == "Updated comment"


# ============================================================================
# delete_comment Tests
# ============================================================================


@patch("app.crud.comment.db")
async def test_delete_comment_success(mock_db):
    # GIVEN a comment exists
    mock_result = MagicMock()
    mock_result.deleted_count = 1
    mock_db.comments = MagicMock()
    mock_db.comments.delete_one = AsyncMock(return_value=mock_result)

    # WHEN delete_comment is called
    result = await comment_crud.delete_comment("test-comment-id-123")

    # THEN True is returned
    assert result is True


@patch("app.crud.comment.db")
async def test_delete_comment_not_found(mock_db):
    # GIVEN no comment exists
    mock_result = MagicMock()
    mock_result.deleted_count = 0
    mock_db.comments = MagicMock()
    mock_db.comments.delete_one = AsyncMock(return_value=mock_result)

    # WHEN delete_comment is called
    result = await comment_crud.delete_comment("nonexistent-id")

    # THEN False is returned
    assert result is False


# ============================================================================
# Edge Cases: get_comments_by_article with no user
# ============================================================================


@patch("app.crud.comment.user_crud")
@patch("app.crud.comment.db")
async def test_get_comments_by_magazine_user_not_found(
    mock_db, mock_user_crud, test_user
):
    # GIVEN magazine comments exist but user doesn't
    magazine_comment = {
        "id": "magazine-comment-id",
        "content": "Magazine comment",
        "magazine_id": "test-magazine-id",
        "user_id": "unknown-user-id",
        "created_at": datetime.utcnow(),
    }
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[magazine_comment])
    mock_db.comments = MagicMock()
    mock_db.comments.find = MagicMock(return_value=mock_cursor)

    mock_user_crud.get_user_by_id = AsyncMock(return_value=None)

    # WHEN get_comments_by_magazine is called
    result = await comment_crud.get_comments_by_magazine("test-magazine-id")

    # THEN comments have fallback user info
    assert len(result) == 1
    assert result[0]["user"]["username"] == "Unknown User"


# ============================================================================
# Edge Cases: get_comments_by_user with deleted magazine
# ============================================================================


@patch("app.crud.comment.user_crud")
@patch("app.crud.comment.db")
async def test_get_comments_by_user_deleted_magazine(
    mock_db, mock_user_crud, test_user
):
    # GIVEN user has comments but magazine was deleted
    user_comment = {
        "id": "user-comment-id",
        "content": "User comment",
        "magazine_id": "deleted-magazine-id",
        "user_id": test_user["id"],
        "created_at": datetime.utcnow(),
    }

    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[user_comment])
    mock_db.comments = MagicMock()
    mock_db.comments.find = MagicMock(return_value=mock_cursor)
    mock_db.magazines = MagicMock()
    mock_db.magazines.find_one = AsyncMock(return_value=None)

    mock_user_crud.get_user_by_id = AsyncMock(return_value=test_user)

    # WHEN get_comments_by_user is called
    result = await comment_crud.get_comments_by_user(test_user["id"])

    # THEN comments show deleted magazine
    assert len(result) == 1
    assert result[0]["magazine_title"] == "Deleted Magazine"


@patch("app.crud.comment.user_crud")
@patch("app.crud.comment.db")
async def test_get_comments_by_user_no_article_or_magazine(
    mock_db, mock_user_crud, test_user
):
    # GIVEN user has comments with neither article_id nor magazine_id
    user_comment = {
        "id": "user-comment-id",
        "content": "Orphan comment",
        "user_id": test_user["id"],
        "created_at": datetime.utcnow(),
    }

    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[user_comment])
    mock_db.comments = MagicMock()
    mock_db.comments.find = MagicMock(return_value=mock_cursor)

    mock_user_crud.get_user_by_id = AsyncMock(return_value=test_user)

    # WHEN get_comments_by_user is called
    result = await comment_crud.get_comments_by_user(test_user["id"])

    # THEN comments have article_title set to None
    assert len(result) == 1
    assert result[0]["article_title"] is None


@patch("app.crud.comment.user_crud")
@patch("app.crud.comment.db")
async def test_get_comments_by_user_unknown_user(mock_db, mock_user_crud):
    # GIVEN user not found
    user_comment = {
        "id": "user-comment-id",
        "content": "Comment",
        "article_id": "a1",
        "user_id": "unknown-user-id",
        "created_at": datetime.utcnow(),
    }

    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[user_comment])
    mock_db.comments = MagicMock()
    mock_db.comments.find = MagicMock(return_value=mock_cursor)
    mock_db.articles = MagicMock()
    mock_db.articles.find_one = AsyncMock(return_value={"id": "a1", "title": "Art"})

    mock_user_crud.get_user_by_id = AsyncMock(return_value=None)

    # WHEN get_comments_by_user is called
    result = await comment_crud.get_comments_by_user("unknown-user-id")

    # THEN fallback user info is used
    assert result[0]["user"]["username"] == "Unknown User"


# ============================================================================
# Edge Cases: create_magazine_comment user not found
# ============================================================================


@patch("app.crud.comment.user_crud")
@patch("app.crud.comment.db")
async def test_create_magazine_comment_user_not_found(mock_db, mock_user_crud):
    # GIVEN magazine comment data but user doesn't exist
    comment_in = CommentCreate(content="Magazine comment")
    created_comment = {
        "id": "new-magazine-comment-id",
        "content": "Magazine comment",
        "magazine_id": "test-magazine-id",
        "user_id": "unknown-user-id",
        "created_at": datetime.utcnow(),
        "updated_at": None,
    }
    mock_db.comments = MagicMock()
    mock_db.comments.insert_one = AsyncMock()
    mock_db.comments.find_one = AsyncMock(return_value=created_comment)

    mock_user_crud.get_user_by_id = AsyncMock(return_value=None)

    # WHEN create_magazine_comment is called
    result = await comment_crud.create_magazine_comment(
        "test-magazine-id", "unknown-user-id", comment_in
    )

    # THEN comment has fallback user info
    assert result["user"]["username"] == "Unknown User"
