import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
from app.models.news import NewsPost
from app.core.config import settings

logger = logging.getLogger(__name__)

async def send_newsletter_email(email: str, news_items: List[NewsPost]):
    """
    Sends a real email using SMTP configuration from settings.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not set. Mocking email send (recipient redacted).")
        print("--- MOCK EMAIL SEND (No SMTP config; recipient redacted) ---")
        return True

    logger.info(f"Sending real newsletter to {email} via {settings.SMTP_HOST}")
    
    # Create the email message
    message = MIMEMultipart("alternative")
    message["Subject"] = "Your Weekly Flipboard Digest"
    message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    message["To"] = email

    # Create HTML content
    html_content = f"<h1>Hello!</h1><p>Here are the most important news for your favorite topics:</p><ul>"
    for item in news_items[:5]:
        html_content += f"<li><strong><a href='{item.url}'>{item.title}</a></strong><br/>{item.text[:150]}...</li>"
    html_content += "</ul><p>Enjoy your reading!</p>"

    # Attach HTML part
    part = MIMEText(html_content, "html")
    message.attach(part)

    try:
        # Connect to SMTP server
        # For port 587 (TLS), we use starttls
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_PORT == 587:
                server.starttls()
            
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, email, message.as_string())
            
        logger.info(f"Email successfully sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {email}: {str(e)}")
        return False
