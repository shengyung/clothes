from fastapi import HTTPException

ALLOWED_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def validate_image_upload(content_type: str | None, size: int) -> None:
    if content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="僅支援 JPEG / PNG / WebP 圖片")
    if size > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="檔案大小不可超過 10MB")
