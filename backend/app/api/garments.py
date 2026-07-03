from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from app.db import get_session
from app.models import Garment
from app.storage import get_presigned_url, upload_image

router = APIRouter(tags=["garments"])


@router.get("/garments")
def list_garments(session: Session = Depends(get_session)):
    garments = session.exec(select(Garment)).all()
    return [
        {
            "id": g.id,
            "name": g.name,
            "category": g.category,
            "image_url": get_presigned_url(g.image_url) if g.image_url else None,
        }
        for g in garments
    ]


@router.post("/garments/upload")
async def upload_garment(
    file: UploadFile,
    name: str = Form(default="自訂服裝"),
    session: Session = Depends(get_session),
):
    contents = await file.read()
    key = upload_image(contents, content_type=file.content_type or "image/png", prefix="garment-images")
    garment = Garment(name=name, category="tops", image_url=key)
    session.add(garment)
    session.commit()
    session.refresh(garment)
    return {
        "id": garment.id,
        "name": garment.name,
        "category": garment.category,
        "image_url": get_presigned_url(garment.image_url),
    }


@router.get("/garments/{garment_id}")
def get_garment(garment_id: str, session: Session = Depends(get_session)):
    garment = session.get(Garment, garment_id)
    if not garment:
        raise HTTPException(status_code=404, detail="Garment not found")
    return {
        "id": garment.id,
        "name": garment.name,
        "category": garment.category,
        "image_url": get_presigned_url(garment.image_url) if garment.image_url else None,
    }
