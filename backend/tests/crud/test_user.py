import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.crud import user as user_crud
from app.schemas.user import UserCreate

# Mark all tests in this file as anyio tests
pytestmark = pytest.mark.anyio

@patch('app.crud.user.db')
async def test_get_user_by_email(mock_db):
    # GIVEN a user exists in the database
    user_data = {"email": "test@example.com", "username": "testuser"}
    # Configure the mock for async attribute access and method call
    mock_db.users = MagicMock()
    mock_db.users.find_one = AsyncMock(return_value=user_data)

    # WHEN get_user_by_email is called
    user = await user_crud.get_user_by_email("test@example.com")

    # THEN the user is returned and the mock was called correctly
    mock_db.users.find_one.assert_awaited_with({"email": "test@example.com"})
    assert user is not None
    assert user["email"] == "test@example.com"

@patch('app.crud.user.db')
async def test_get_user_by_email_not_found(mock_db):
    # GIVEN a user does not exist
    mock_db.users = MagicMock()
    mock_db.users.find_one = AsyncMock(return_value=None)

    # WHEN get_user_by_email is called
    user = await user_crud.get_user_by_email("test@example.com")

    # THEN None is returned
    assert user is None

@patch('app.crud.user.db')
async def test_get_user_by_username(mock_db):
    # GIVEN a user exists
    user_data = {"email": "test@example.com", "username": "testuser"}
    mock_db.users = MagicMock()
    mock_db.users.find_one = AsyncMock(return_value=user_data)

    # WHEN get_user_by_username is called
    user = await user_crud.get_user_by_username("testuser")

    # THEN the user is returned
    mock_db.users.find_one.assert_awaited_with({"username": "testuser"})
    assert user is not None
    assert user["username"] == "testuser"

@patch('app.crud.user.db')
async def test_get_user_by_username_not_found(mock_db):
    # GIVEN a user does not exist
    mock_db.users = MagicMock()
    mock_db.users.find_one = AsyncMock(return_value=None)

    # WHEN get_user_by_username is called
    user = await user_crud.get_user_by_username("testuser")

    # THEN None is returned
    assert user is None

@patch("app.crud.user.get_password_hash")
@patch('app.crud.user.db')
async def test_create_user(mock_db, mock_get_password_hash):
    # GIVEN user data for a new user
    mock_db.users = MagicMock()
    mock_db.users.insert_one = AsyncMock()
    # The create_user function returns the created user, so we need to mock the find_one call too
    created_user_doc = {"username": "newuser", "email": "new@example.com", "hashed_password": "hashedpassword"}
    mock_db.users.find_one = AsyncMock(return_value=created_user_doc)
    mock_get_password_hash.return_value = "hashedpassword"
    user_in = UserCreate(email="new@example.com", username="newuser", password="password")

    # WHEN create_user is called
    result_user = await user_crud.create_user(user_in)

    # THEN the user is inserted into the database and the new user is returned
    mock_db.users.insert_one.assert_awaited_once()
    inserted_data = mock_db.users.insert_one.call_args[0][0]
    assert inserted_data["email"] == "new@example.com"
    assert inserted_data["username"] == "newuser"
    assert inserted_data["hashed_password"] == "hashedpassword"
    mock_db.users.find_one.assert_awaited_with({"username": user_in.username})
    assert result_user == created_user_doc


@patch("app.crud.user.verify_password")
@patch("app.crud.user.get_user_by_username")
async def test_authenticate_user_success(mock_get_user_by_username, mock_verify_password):
    # GIVEN a correct username and password
    user_data = {"username": "testuser", "hashed_password": "hashedpassword"}
    mock_get_user_by_username.return_value = user_data
    mock_verify_password.return_value = True

    # WHEN authenticate_user is called
    result = await user_crud.authenticate_user("testuser", "password")

    # THEN the user object is returned
    assert result is not None
    assert result["username"] == "testuser"

@patch("app.crud.user.get_user_by_username")
async def test_authenticate_user_not_found(mock_get_user_by_username):
    # GIVEN a user that does not exist
    mock_get_user_by_username.return_value = None

    # WHEN authenticate_user is called
    result = await user_crud.authenticate_user("testuser", "password")

    # THEN the result is False
    assert result is False

@patch("app.crud.user.verify_password")
@patch("app.crud.user.get_user_by_username")
async def test_authenticate_user_wrong_password(mock_get_user_by_username, mock_verify_password):
    # GIVEN an incorrect password
    user_data = {"username": "testuser", "hashed_password": "hashedpassword"}
    mock_get_user_by_username.return_value = user_data
    mock_verify_password.return_value = False

    # WHEN authenticate_user is called
    result = await user_crud.authenticate_user("testuser", "wrongpassword")

    # THEN the result is False
    assert result is False