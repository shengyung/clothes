from fastapi import APIRouter, Request, UploadFile

from app.main import limiter
from app.storage import get_presigned_url, upload_image

router = APIRouter(tags=["upload"])


@router.post("/upload")
@limiter.limit("20/minute")
async def upload(request: Request, file: UploadFile):
    contents = await file.read()
    key = upload_image(contents, content_type=file.content_type or "image/png")
    return {"key": key, "url": get_presigned_url(key)}
