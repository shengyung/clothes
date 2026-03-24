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
    jwt_expire_days: int = 7

    # Public URL for MinIO (used for presigned URLs accessible from browser)
    minio_public_endpoint: str = "localhost:9000"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
