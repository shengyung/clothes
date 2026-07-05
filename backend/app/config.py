from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Fashn.ai
    fashn_api_key: str = ""

    # Storage mode — USE_S3=false 用 MinIO（本地），USE_S3=true 用 AWS S3（生產）
    use_s3: bool = False
    s3_region: str = "ap-northeast-1"

    # MinIO（本地開發）
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "tryon"
    minio_use_ssl: bool = False
    minio_public_endpoint: str = "localhost:9000"

    # AWS S3（生產）
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_s3_bucket: str = "vtr-prod"

    # Database
    database_url: str = "sqlite:///./tryon.db"

    # JWT
    jwt_secret: str = "change-me-in-production"
    access_token_expire_minutes: int = 60 * 24   # 1 天
    refresh_token_expire_days: int = 30

    # CORS — 逗號分隔的白名單，生產環境需覆蓋成實際網域（見 docker-compose.prod.yml）
    cors_origins: str = "http://localhost:3000"

    # Email (Resend)
    resend_api_key: str = ""
    frontend_url: str = "http://localhost:3000"

    # Deploy tracking — set via GIT_SHA env var at container start (see docker-compose.yml)
    git_sha: str = "unknown"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
