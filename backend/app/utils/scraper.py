import logging

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


async def scrape_article_content(url: str) -> str:
    """
    Scrapes the main content of an article from a given URL.
    Returns the HTML content of the article body or a simple text representation.
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/91.0.4472.124 Safari/537.36"
        )
    }

    try:
        async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
            response = await client.get(url, headers=headers, timeout=10.0)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "lxml")

            # Remove unwanted elements
            unwanted_selectors = [
                "script", "style", "nav", "header", "footer", "iframe", "noscript",
                "aside", "form", ".social-share", ".related-posts",
                ".newsletter-signup", ".ad-container", ".advertisement",
                ".sidebar", ".comments-section", ".tags", ".categories",
                ".author-bio", "#sidebar", "#comments", ".promo-box",
                ".related-links", ".more-from", ".suggested-stories",
                ".article-footer", ".article-sidebar", ".social-icons",
                ".share-bar", ".topic-list", ".tags-list", ".article-sharing",
                ".related-topics", ".topics-container", ".topics-header",
                ".follow-button", ".see-all-topics"
            ]
            for selector in unwanted_selectors:
                if selector.startswith("."):
                    for tag in soup.find_all(class_=lambda x: x and selector[1:] in x):
                        tag.decompose()
                elif selector.startswith("#"):
                    for tag in soup.find_all(id=selector[1:]):
                        tag.decompose()
                else:
                    for tag in soup.find_all(selector):
                        tag.decompose()

            # Remove captions and credits that are often junk
            image_junk = ["credit", "caption", "source", "image-label"]
            for tag in soup.find_all(
                ["span", "div", "p", "figcaption"],
                class_=lambda x: x and any(c in x.lower() for c in image_junk)
            ):
                tag.decompose()

            # Remove text-based related content (common in news sites)
            for div in soup.find_all(["div", "section", "p", "span", "button"]):
                text = div.get_text().strip()
                text_lower = text.lower()

                # Check for social/topic junk patterns
                junk_patterns = [
                    "more from", "go deeper", "related stories", "read more",
                    "suggested for you", "latest news", "sign up for our newsletter",
                    "follow us on", "in:", "tags:", "see all topics",
                    "facebook tweetemail", "link copied!", "follow",
                    "share this", "republished from"
                ]

                if any(phrase in text_lower for phrase in junk_patterns):
                    # Only decompose if it's a short element
                    if len(text) < 150:
                        div.decompose()
                    # Specific check for social bars
                    elif (
                        "facebook" in text_lower and
                        "tweet" in text_lower and
                        "email" in text_lower
                    ):
                        div.decompose()

            # Heuristics to find the main content
            # 1. Look for <article> tag
            article = soup.find("article")
            if article:
                return str(article)

            # 2. Look for common class names
            common_classes = [
                "article-content",
                "entry-content",
                "post-content",
                "main-content",
                "story-body",
                "article-body",
                "content-body",
            ]

            for cls in common_classes:
                content_div = soup.find("div", class_=lambda x: x and cls in x)
                if content_div:
                    return str(content_div)

            # 3. Fallback: Find the div with the most <p> tags
            # This is a crude but often effective heuristic
            paragraphs = soup.find_all("p")
            if len(paragraphs) > 5:
                # Find the parent of the most paragraphs
                # We count usage of parents
                parents = {}
                for p in paragraphs:
                    parent = p.parent
                    if parent.name in ["div", "section"]:
                        if parent not in parents:
                            parents[parent] = 0
                        parents[parent] += 1

                if parents:
                    best_parent = max(parents, key=parents.get)
                    return str(best_parent)

            return (
                "<p>Could not extract full content automatically. "
                "Please visit the source.</p>"
            )

    except Exception as e:
        logger.error(f"Error scraping {url}: {str(e)}", exc_info=True)
        raise