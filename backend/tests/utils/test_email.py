from unittest.mock import MagicMock, patch

import pytest

from app.models.news import NewsPost
from app.utils.email import send_newsletter_email

pytestmark = pytest.mark.anyio


# ============================================================================
# send_newsletter_email Tests
# ============================================================================


@patch("app.utils.email.settings")
async def test_send_newsletter_email_no_smtp_credentials(mock_settings):
    mock_settings.SMTP_USER = ""
    mock_settings.SMTP_PASSWORD = ""

    news_items = [NewsPost(uuid="p1", title="Test", url="http://test.com", text="x")]
    result = await send_newsletter_email("test@example.com", news_items)

    assert result is True


@patch("app.utils.email.settings")
async def test_send_newsletter_email_no_smtp_user(mock_settings):
    mock_settings.SMTP_USER = ""
    mock_settings.SMTP_PASSWORD = "password"

    result = await send_newsletter_email("test@example.com", [])

    assert result is True


@patch("app.utils.email.settings")
async def test_send_newsletter_email_no_smtp_password(mock_settings):
    mock_settings.SMTP_USER = "user"
    mock_settings.SMTP_PASSWORD = ""

    result = await send_newsletter_email("test@example.com", [])

    assert result is True


@patch("app.utils.email.smtplib")
@patch("app.utils.email.settings")
async def test_send_newsletter_email_success(mock_settings, mock_smtplib):
    mock_settings.SMTP_USER = "user@gmail.com"
    mock_settings.SMTP_PASSWORD = "password"
    mock_settings.SMTP_HOST = "smtp.gmail.com"
    mock_settings.SMTP_PORT = 587
    mock_settings.EMAILS_FROM_EMAIL = "from@example.com"
    mock_settings.EMAILS_FROM_NAME = "Flipboard Clone"

    mock_server = MagicMock()
    mock_smtplib.SMTP.return_value.__enter__ = MagicMock(return_value=mock_server)
    mock_smtplib.SMTP.return_value.__exit__ = MagicMock(return_value=False)

    news_items = [
        NewsPost(uuid="p1", title="News 1", url="http://test.com/1", text="Content 1"),
        NewsPost(uuid="p2", title="News 2", url="http://test.com/2", text="Content 2"),
    ]

    result = await send_newsletter_email("recipient@example.com", news_items)

    assert result is True
    mock_server.starttls.assert_called_once()
    mock_server.login.assert_called_once_with("user@gmail.com", "password")
    mock_server.sendmail.assert_called_once()


@patch("app.utils.email.smtplib")
@patch("app.utils.email.settings")
async def test_send_newsletter_email_non_tls_port(mock_settings, mock_smtplib):
    mock_settings.SMTP_USER = "user@gmail.com"
    mock_settings.SMTP_PASSWORD = "password"
    mock_settings.SMTP_HOST = "smtp.example.com"
    mock_settings.SMTP_PORT = 25
    mock_settings.EMAILS_FROM_EMAIL = "from@example.com"
    mock_settings.EMAILS_FROM_NAME = "Flipboard Clone"

    mock_server = MagicMock()
    mock_smtplib.SMTP.return_value.__enter__ = MagicMock(return_value=mock_server)
    mock_smtplib.SMTP.return_value.__exit__ = MagicMock(return_value=False)

    news_items = [NewsPost(uuid="p1", title="News 1", url="http://t.com", text="C")]

    result = await send_newsletter_email("recipient@example.com", news_items)

    assert result is True
    mock_server.starttls.assert_not_called()


@patch("app.utils.email.smtplib")
@patch("app.utils.email.settings")
async def test_send_newsletter_email_smtp_error(mock_settings, mock_smtplib):
    mock_settings.SMTP_USER = "user@gmail.com"
    mock_settings.SMTP_PASSWORD = "password"
    mock_settings.SMTP_HOST = "smtp.gmail.com"
    mock_settings.SMTP_PORT = 587
    mock_settings.EMAILS_FROM_EMAIL = "from@example.com"
    mock_settings.EMAILS_FROM_NAME = "Flipboard Clone"

    mock_server = MagicMock()
    mock_server.login.side_effect = Exception("Auth failed")
    mock_smtplib.SMTP.return_value.__enter__ = MagicMock(return_value=mock_server)
    mock_smtplib.SMTP.return_value.__exit__ = MagicMock(return_value=False)

    result = await send_newsletter_email("recipient@example.com", [])

    assert result is False


@patch("app.utils.email.smtplib")
@patch("app.utils.email.settings")
async def test_send_newsletter_email_limits_to_5_items(mock_settings, mock_smtplib):
    mock_settings.SMTP_USER = "user@gmail.com"
    mock_settings.SMTP_PASSWORD = "password"
    mock_settings.SMTP_HOST = "smtp.gmail.com"
    mock_settings.SMTP_PORT = 587
    mock_settings.EMAILS_FROM_EMAIL = "from@example.com"
    mock_settings.EMAILS_FROM_NAME = "Flipboard"

    mock_server = MagicMock()
    mock_smtplib.SMTP.return_value.__enter__ = MagicMock(return_value=mock_server)
    mock_smtplib.SMTP.return_value.__exit__ = MagicMock(return_value=False)

    news_items = [
        NewsPost(uuid=f"p{i}", title=f"News {i}", url=f"http://t.com/{i}", text="C")
        for i in range(10)
    ]

    result = await send_newsletter_email("recipient@example.com", news_items)

    assert result is True
    # Check the HTML content sent contains only 5 items
    send_call = mock_server.sendmail.call_args[0]
    html_body = send_call[2]
    assert html_body.count("<li>") == 5
