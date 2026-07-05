import time
import uuid

import boto3
from botocore.config import Config

from app.config import settings

# Presigned URLs embed a fresh signature/timestamp on every call, so regenerating
# one per API request makes browsers treat the same image as a new resource each
# time and defeats HTTP caching. Reuse the same URL for a key until it's close to
# expiring so repeat page loads can hit the browser cache.
_PRESIGN_REFRESH_MARGIN = 300  # seconds before expiry to force regeneration
_presign_cache: dict[str, tuple[str, float]] = {}


def _get_client(for_presign: bool = False):
    """Return a boto3 S3 client.

    - use_s3=True  → 真實 AWS S3（生產）
    - use_s3=False → MinIO（本地開發），for_presign 時改用 public endpoint
    """
    if settings.use_s3:
        # Use regional endpoint + virtual-hosted style to avoid cross-region redirect (presign breaks on redirect)
        return boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.s3_region,
            endpoint_url=f"https://s3-{settings.s3_region}.amazonaws.com",
            config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
        )
    else:
        endpoint = settings.minio_public_endpoint if for_presign else settings.minio_endpoint
        scheme = "https" if settings.minio_use_ssl else "http"
        return boto3.client(
            "s3",
            endpoint_url=f"{scheme}://{endpoint}",
            aws_access_key_id=settings.minio_access_key,
            aws_secret_access_key=settings.minio_secret_key,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",
        )


def _bucket() -> str:
    return settings.aws_s3_bucket if settings.use_s3 else settings.minio_bucket


def ensure_bucket():
    """建立 bucket（MinIO 開發用；S3 生產環境請事先在 Console 建立）。"""
    if settings.use_s3:
        return  # S3 bucket 在 AWS Console 手動建立
    client = _get_client()
    try:
        client.head_bucket(Bucket=_bucket())
    except Exception:
        client.create_bucket(Bucket=_bucket())


def upload_image(file_bytes: bytes, content_type: str = "image/png", prefix: str = "images") -> str:
    """Upload image bytes to storage and return the object key."""
    client = _get_client()
    ensure_bucket()
    key = f"{prefix}/{uuid.uuid4().hex}.png"
    client.put_object(
        Bucket=_bucket(),
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
        # Keys are random uuids and never overwritten, so the content behind a
        # given key is immutable — safe to let browsers cache it indefinitely.
        CacheControl="public, max-age=31536000, immutable",
    )
    return key


def delete_image(key: str) -> None:
    """Delete an object from storage. No-op for empty/already-deleted keys."""
    if not key or key == "deleted":
        return
    client = _get_client()
    client.delete_object(Bucket=_bucket(), Key=key)
    _presign_cache.pop(key, None)


def get_presigned_url(key: str, expires: int = 3600) -> str:
    """Generate a presigned URL for browser access, reusing a cached URL for the
    same key while it still has enough validity left to be worth caching."""
    now = time.monotonic()
    cached = _presign_cache.get(key)
    if cached is not None:
        url, generated_at = cached
        if now - generated_at < expires - _PRESIGN_REFRESH_MARGIN:
            return url

    client = _get_client(for_presign=True)
    url = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": _bucket(), "Key": key},
        ExpiresIn=expires,
    )
    _presign_cache[key] = (url, now)
    return url
