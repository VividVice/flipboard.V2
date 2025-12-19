from app.db.database import db
from app.crud.news import fetch_news_feed
from app.utils.email import send_newsletter_email
import logging

logger = logging.getLogger(__name__)

async def process_weekly_newsletter():
    """
    Finds all subscribed users and sends them their personalized weekly newsletter.
    """
    logger.info("Starting weekly newsletter processing...")
    
    # 1. Find all subscribed users
    cursor = db.users.find({"newsletter_subscribed": True})
    users = await cursor.to_list(length=None)
    
    if not users:
        logger.info("No users subscribed to newsletter.")
        return
        
    for user in users:
        topic_ids = user.get("followed_topics", [])
        if not topic_ids:
            continue
            
        try:
            # 2. Resolve topic IDs to names
            topic_names = []
            if topic_ids:
                topic_cursor = db.topics.find({"id": {"$in": topic_ids}})
                topic_docs = await topic_cursor.to_list(length=None)
                topic_names = [doc["name"] for doc in topic_docs]
            
            if not topic_names:
                logger.warning(f"No topics found for user {user['email']} with IDs: {topic_ids}")
                continue

            # 3. Fetch news for user topics
            news_response = await fetch_news_feed(topics=topic_names, size=5)
            
            if news_response.posts:
                # 4. Send email
                await send_newsletter_email(user["email"], news_response.posts)
                logger.info(f"Newsletter sent to {user['email']}")
            else:
                logger.warning(f"No news found for user {user['email']} topics: {topic_names}")
        except Exception as e:
            logger.error(f"Failed to process newsletter for {user['email']}: {str(e)}")

    logger.info("Weekly newsletter processing finished.")
