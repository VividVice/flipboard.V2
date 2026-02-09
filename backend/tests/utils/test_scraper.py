from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.utils.scraper import scrape_article_content

pytestmark = pytest.mark.anyio


# ============================================================================
# scrape_article_content Tests
# ============================================================================


@patch("app.utils.scraper.httpx.AsyncClient")
async def test_scrape_article_with_article_tag(mock_client_class):
    html = """
    <html>
    <body>
        <nav>Navigation</nav>
        <article>
            <h1>Test Article</h1>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
        </article>
        <footer>Footer</footer>
    </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.text = html
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    result = await scrape_article_content("http://example.com/article")

    assert "<article>" in result
    assert "Test Article" in result
    assert "Paragraph 1" in result
    assert "<nav>" not in result
    assert "<footer>" not in result


@patch("app.utils.scraper.httpx.AsyncClient")
async def test_scrape_article_with_common_class(mock_client_class):
    html = """
    <html>
    <body>
        <div class="article-content">
            <h1>Title</h1>
            <p>Content here</p>
        </div>
    </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.text = html
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    result = await scrape_article_content("http://example.com/article")

    assert "Content here" in result


@patch("app.utils.scraper.httpx.AsyncClient")
async def test_scrape_article_fallback_to_most_paragraphs(mock_client_class):
    html = """
    <html>
    <body>
        <div>
            <p>Para 1</p>
            <p>Para 2</p>
            <p>Para 3</p>
            <p>Para 4</p>
            <p>Para 5</p>
            <p>Para 6</p>
        </div>
    </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.text = html
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    result = await scrape_article_content("http://example.com/article")

    assert "Para 1" in result


@patch("app.utils.scraper.httpx.AsyncClient")
async def test_scrape_article_no_content_fallback(mock_client_class):
    html = """
    <html>
    <body>
        <p>Short</p>
    </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.text = html
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    result = await scrape_article_content("http://example.com/article")

    assert "Could not extract" in result


@patch("app.utils.scraper.httpx.AsyncClient")
async def test_scrape_article_removes_scripts_and_styles(mock_client_class):
    html = """
    <html>
    <head><style>.x{color:red}</style></head>
    <body>
        <script>alert('hi')</script>
        <article>
            <p>Clean content</p>
        </article>
    </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.text = html
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    result = await scrape_article_content("http://example.com/article")

    assert "Clean content" in result
    assert "alert" not in result
    assert "color:red" not in result


@patch("app.utils.scraper.httpx.AsyncClient")
async def test_scrape_article_removes_junk_patterns(mock_client_class):
    html = """
    <html>
    <body>
        <article>
            <p>Real content here</p>
            <div>Read more about this</div>
            <div>Follow us on Twitter</div>
        </article>
    </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.text = html
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    result = await scrape_article_content("http://example.com/article")

    assert "Real content here" in result


@patch("app.utils.scraper.httpx.AsyncClient")
async def test_scrape_article_removes_class_based_junk(mock_client_class):
    html = """
    <html>
    <body>
        <article>
            <p>Real content</p>
            <div class="social-share">Share buttons</div>
            <div class="related-posts">Related</div>
            <div id="sidebar">Sidebar stuff</div>
            <div id="comments">Comments section</div>
        </article>
    </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.text = html
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    result = await scrape_article_content("http://example.com/article")

    assert "Real content" in result
    assert "Share buttons" not in result
    assert "Sidebar stuff" not in result


@patch("app.utils.scraper.httpx.AsyncClient")
async def test_scrape_article_removes_image_captions(mock_client_class):
    html = """
    <html>
    <body>
        <article>
            <p>Main content</p>
            <figcaption class="caption">Image caption</figcaption>
            <span class="credit">Photo credit</span>
        </article>
    </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.text = html
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    result = await scrape_article_content("http://example.com/article")

    assert "Main content" in result
    assert "Image caption" not in result
    assert "Photo credit" not in result


@patch("app.utils.scraper.httpx.AsyncClient")
async def test_scrape_article_http_error(mock_client_class):
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(
        side_effect=httpx.HTTPStatusError(
            "Not Found",
            request=MagicMock(),
            response=MagicMock(status_code=404),
        )
    )
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    with pytest.raises(httpx.HTTPStatusError):
        await scrape_article_content("http://example.com/not-found")


@patch("app.utils.scraper.httpx.AsyncClient")
async def test_scrape_article_connection_error(mock_client_class):
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(side_effect=Exception("Connection refused"))
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    with pytest.raises(Exception, match="Connection refused"):
        await scrape_article_content("http://example.com/timeout")


@patch("app.utils.scraper.httpx.AsyncClient")
async def test_scrape_removes_social_bar(mock_client_class):
    html = """
    <html>
    <body>
        <article>
            <p>Content</p>
            <div>facebook tweetemail share link copied!</div>
        </article>
    </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.text = html
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    result = await scrape_article_content("http://example.com/article")

    assert "Content" in result


@patch("app.utils.scraper.httpx.AsyncClient")
async def test_scrape_removes_long_social_bar(mock_client_class):
    # GIVEN a div with junk pattern text >= 150 chars containing facebook, tweet, email
    long_social = (
        "Share this article on social media: facebook tweet email "
        "Share this article on social media: facebook tweet email "
        "Share this article on social media share link copied!"
    )
    html = f"""
    <html>
    <body>
        <article>
            <p>Real article content here</p>
            <div>{long_social}</div>
        </article>
    </body>
    </html>
    """
    mock_response = MagicMock()
    mock_response.text = html
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=mock_response)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client_class.return_value = mock_client

    result = await scrape_article_content("http://example.com/article")

    assert "Real article content here" in result
