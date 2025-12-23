from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str
    MONGODB_DATABASE: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    WEBZ_IO_API_KEY: str

    # Email Settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@flipboard-clone.com"
    EMAILS_FROM_NAME: str = "Flipboard Clone"
    GOOGLE_CLIENT_ID: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
