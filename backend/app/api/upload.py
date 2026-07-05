from fastapi import APIRouter, Depends, Request, UploadFile

from app.auth import get_current_user
from app.main import limiter
from app.models import User
from app.storage import get_presigned_url, upload_image
from app.validation import validate_image_upload

router = APIRouter(tags=["upload"])


@router.post("/upload")
@limiter.limit("20/minute")
async def upload(
    request: Request,
    file: UploadFile,
    current_user: User = Depends(get_current_user),
):
    contents = await file.read()
    validate_image_upload(file.content_type, len(contents))
    key = upload_image(contents, content_type=file.content_type or "image/png")
    return {"key": key, "url": get_presigned_url(key)}
