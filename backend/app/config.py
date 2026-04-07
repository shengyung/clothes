from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Replicate
    replicate_api_token: str = ""

    # MinIO
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "tryon"
    minio_use_ssl: bool = False

    # Database
    database_url: str = "sqlite:///./tryon.db"

    # JWT
    jwt_secret: str = "change-me-in-production"
    access_token_expire_minutes: int = 60 * 24   # 1 天
    refresh_token_expire_days: int = 30

    # Email (Resend)
    resend_api_key: str = ""
    frontend_url: str = "http://localhost:3000"

    # Public URL for MinIO (used for presigned URLs accessible from browser)
    minio_public_endpoint: str = "localhost:9000"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
