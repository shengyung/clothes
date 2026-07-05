from datetime import date as date_type

from fastapi import APIRouter, BackgroundTasks, Depends, Form, HTTPException, Request, UploadFile
from sqlmodel import Session, select

from app.auth import get_current_user
from app.db import get_session
from app.inference import run_tryon
from app.main import limiter
from app.models import Garment, TryonTask, User
from app.storage import delete_image, get_presigned_url, upload_image

router = APIRouter(tags=["tryon"])

DAILY_CREDITS = 5


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
@limiter.limit("10/minute")
async def create_tryon(
    request: Request,
    person_image: UploadFile,
    background_tasks: BackgroundTasks,
    garment_id: str = Form(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    garment = session.get(Garment, garment_id)
    if not garment:
        raise HTTPException(status_code=404, detail="Garment not found")

    # Daily credit check
    today = date_type.today()
    if current_user.credits_reset_date != today:
        current_user.daily_credits_used = 0
        current_user.credits_reset_date = today
    if current_user.daily_credits_used >= DAILY_CREDITS:
        raise HTTPException(status_code=429, detail="今日試穿次數已達上限，明天再來")
    current_user.daily_credits_used += 1
    session.add(current_user)
    session.flush()

    person_bytes = await person_image.read()
    person_key = upload_image(person_bytes, content_type=person_image.content_type or "image/png", prefix="person-images")

    task = TryonTask(
        person_image_url=person_key,
        garment_id=garment_id,
        user_id=current_user.id,
    )
    session.add(task)
    session.commit()
    session.refresh(task)

    background_tasks.add_task(run_tryon, task.id, person_key, garment.image_url, garment.category, garment.name)

    return {
        "task_id": task.id,
        "status": task.status,
        "credits_remaining": DAILY_CREDITS - current_user.daily_credits_used,
    }


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


@router.delete("/tryon/{task_id}", status_code=204)
def delete_tryon(
    task_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    task = session.get(TryonTask, task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")

    delete_image(task.person_image_url)
    if task.result_image_url:
        delete_image(task.result_image_url)

    session.delete(task)
    session.commit()
