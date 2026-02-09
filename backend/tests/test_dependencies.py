from unittest.mock import patch

import pytest
from fastapi import HTTPException

from app.dependencies import get_current_user, get_current_user_optional

pytestmark = pytest.mark.anyio


# ============================================================================
# get_current_user Tests
# ============================================================================


@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_current_user_success(mock_verify, mock_get_user, test_user):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user

    result = await get_current_user(token="valid-token")

    assert result == test_user
    mock_verify.assert_called_once_with("valid-token")
    mock_get_user.assert_awaited_once_with(test_user["id"])


@patch("app.dependencies.verify_token")
async def test_get_current_user_invalid_token(mock_verify):
    mock_verify.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(token="invalid-token")

    assert exc_info.value.status_code == 401
    assert "Invalid authentication credentials" in exc_info.value.detail


@patch("app.dependencies.verify_token")
async def test_get_current_user_no_sub_in_payload(mock_verify):
    mock_verify.return_value = {"other": "data"}

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(token="token-no-sub")

    assert exc_info.value.status_code == 401
    assert "Invalid token payload" in exc_info.value.detail


@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_current_user_user_not_found(mock_verify, mock_get_user):
    mock_verify.return_value = {"sub": "nonexistent-user-id"}
    mock_get_user.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(token="valid-token")

    assert exc_info.value.status_code == 401
    assert "User not found" in exc_info.value.detail


# ============================================================================
# get_current_user_optional Tests
# ============================================================================


async def test_get_current_user_optional_no_token():
    result = await get_current_user_optional(token=None)
    assert result is None


@patch("app.dependencies.get_user_by_id")
@patch("app.dependencies.verify_token")
async def test_get_current_user_optional_valid_token(
    mock_verify, mock_get_user, test_user
):
    mock_verify.return_value = {"sub": test_user["id"]}
    mock_get_user.return_value = test_user

    result = await get_current_user_optional(token="valid-token")

    assert result == test_user


@patch("app.dependencies.verify_token")
async def test_get_current_user_optional_invalid_token(mock_verify):
    mock_verify.return_value = None

    result = await get_current_user_optional(token="invalid-token")

    assert result is None
