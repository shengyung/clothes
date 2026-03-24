from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from app.auth import get_optional_user, get_current_user
from app.db import get_session
from app.inference import run_tryon
from app.models import Garment, TryonTask, User
from app.storage import get_presigned_url, upload_image

router = APIRouter(tags=["tryon"])


def _task_to_dict(task: TryonTask) -> dict:
    result = {
        "task_id": task.id,
        "status": task.status,
        "created_at": task.created_at.isoformat(),
    }
    if task.status == "completed" and task.result_image_url:
        result["result_image_url"] = get_presigned_url(task.result_image_url)
        result["person_image_url"] = get_presigned_url(task.person_image_url)
    if task.status == "failed":
        result["error"] = task.error
    return result


@router.post("/tryon")
async def create_tryon(
    person_image: UploadFile,
    background_tasks: BackgroundTasks,
    garment_id: str = Form(...),
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_optional_user),
):
    garment = session.get(Garment, garment_id)
    if not garment:
        raise HTTPException(status_code=404, detail="Garment not found")

    person_bytes = await person_image.read()
    person_key = upload_image(person_bytes, content_type=person_image.content_type or "image/png")

    task = TryonTask(
        person_image_url=person_key,
        garment_id=garment_id,
        user_id=current_user.id if current_user else None,
    )
    session.add(task)
    session.commit()
    session.refresh(task)

    background_tasks.add_task(run_tryon, task.id, person_key, garment.image_url, garment.category, garment.name)

    return {"task_id": task.id, "status": task.status}


@router.get("/tryon/history")
def get_tryon_history(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    tasks = session.exec(
        select(TryonTask)
        .where(TryonTask.user_id == current_user.id)
        .order_by(TryonTask.created_at.desc())
    ).all()
    return [_task_to_dict(t) for t in tasks]


@router.get("/tryon/{task_id}")
def get_tryon_status(task_id: str, session: Session = Depends(get_session)):
    task = session.get(TryonTask, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _task_to_dict(task)
