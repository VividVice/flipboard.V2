from app.security.password import get_password_hash, verify_password


def test_get_password_hash():
    password = "testpassword"
    hashed_password = get_password_hash(password)
    assert hashed_password is not None
    assert password != hashed_password


def test_verify_password():
    password = "testpassword"
    hashed_password = get_password_hash(password)
    assert verify_password(password, hashed_password) is True
    assert verify_password("wrongpassword", hashed_password) is False
