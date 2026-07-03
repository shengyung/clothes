import time
import traceback

import httpx
from sqlmodel import Session

from app.config import settings
from app.db import engine
from app.models import TryonTask
from app.storage import get_presigned_url, upload_image

FASHN_RUN_URL = "https://api.fashn.ai/v1/run"
FASHN_STATUS_URL = "https://api.fashn.ai/v1/status/{id}"
POLL_INTERVAL = 3   # 秒
POLL_TIMEOUT = 120  # 最多等 2 分鐘


def run_tryon(task_id: str, person_key: str, garment_key: str, category: str, garment_des: str = ""):
    """Run virtual try-on via Fashn.ai API. Called as a BackgroundTask."""
    with Session(engine) as session:
        task = session.get(TryonTask, task_id)
        if not task:
            return

        task.status = "processing"
        session.add(task)
        session.commit()

        try:
            headers = {
                "Authorization": f"Bearer {settings.fashn_api_key}",
                "Content-Type": "application/json",
            }

            # 產生圖片的可存取 URL 傳給 Fashn.ai
            person_url = get_presigned_url(person_key, expires=3600)
            garment_url = get_presigned_url(garment_key, expires=3600)

            # 送出推論請求
            payload = {
                "model_name": "tryon-max",
                "inputs": {
                    "model_image": person_url,
                    "product_image": garment_url,
                    "resolution": "2k",
                    "generation_mode": "quality",
                },
            }

            print(f"FASHN person_url: {person_url}")
            print(f"FASHN garment_url: {garment_url}")

            with httpx.Client(timeout=30) as client:
                run_resp = client.post(FASHN_RUN_URL, json=payload, headers=headers)
                if not run_resp.is_success:
                    print(f"FASHN ERROR BODY: {run_resp.text}")
                run_resp.raise_for_status()
                prediction_id = run_resp.json()["id"]

                # 輪詢狀態
                elapsed = 0
                while elapsed < POLL_TIMEOUT:
                    time.sleep(POLL_INTERVAL)
                    elapsed += POLL_INTERVAL

                    status_resp = client.get(
                        FASHN_STATUS_URL.format(id=prediction_id),
                        headers=headers,
                    )
                    status_resp.raise_for_status()
                    status_data = status_resp.json()
                    status = status_data.get("status")

                    if status == "completed":
                        result_url = status_data["output"][0]
                        break
                    elif status == "failed":
                        error_info = status_data.get("error", {})
                        raise RuntimeError(f"Fashn.ai failed: {error_info}")
                    # starting / in_queue / processing → 繼續等
                else:
                    raise TimeoutError(f"Fashn.ai timeout after {POLL_TIMEOUT}s")

            # 下載結果圖並上傳到 S3/MinIO
            img_resp = httpx.get(result_url, timeout=60)
            img_resp.raise_for_status()
            result_key = upload_image(img_resp.content, content_type="image/png", prefix="result-images")

            task.result_image_url = result_key
            task.status = "completed"

        except Exception as e:
            print("TRYON ERROR:", traceback.format_exc())
            task.status = "failed"
            task.error = str(e)[:500]

        session.add(task)
        session.commit()
