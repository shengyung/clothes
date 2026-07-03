#!/usr/bin/env python3
"""
定期清洗 S3/MinIO 中的用戶圖片。

Block A：刪除 30 天前 TryonTask 的圖片
    - 刪 S3: person_image_url, result_image_url
    - 更新 DB: person_image_url = "deleted", result_image_url = None
    - TryonTask 記錄本身保留（歷史不刪）

Block B：刪除 person-images/ 下的孤立圖（7 天前、DB 裡沒有對應 TryonTask）
    - 防止未被使用的上傳圖片永久留存

建議在 EC2 上設定 cron，每天凌晨 3:30 跑一次：
    30 3 * * * docker exec clothes-backend-1 python scripts/cleanup_images.py >> /var/log/tryon_cleanup.log 2>&1
"""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlmodel import Session, select

from app.db import engine
from app.models import TryonTask
from app.storage import _bucket, _get_client, ensure_bucket

TASK_RETENTION_DAYS = 30
ORPHAN_RETENTION_DAYS = 7


def _delete_s3_key(client, bucket: str, key: str):
    if key and key != "deleted":
        try:
            client.delete_object(Bucket=bucket, Key=key)
        except Exception as e:
            print(f"  警告：刪除 {key} 失敗: {e}")


def cleanup_old_tasks(client, bucket: str, session: Session) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=TASK_RETENTION_DAYS)
    tasks = session.exec(
        select(TryonTask).where(TryonTask.created_at < cutoff)
    ).all()

    deleted_count = 0
    for task in tasks:
        if task.person_image_url and task.person_image_url != "deleted":
            _delete_s3_key(client, bucket, task.person_image_url)
            task.person_image_url = "deleted"
            deleted_count += 1

        if task.result_image_url:
            _delete_s3_key(client, bucket, task.result_image_url)
            task.result_image_url = None
            deleted_count += 1

        session.add(task)

    session.commit()
    return len(tasks)


def cleanup_orphan_person_images(client, bucket: str, session: Session) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=ORPHAN_RETENTION_DAYS)

    # 取出 DB 裡所有 person_image_url
    known_keys = set(
        t.person_image_url for t in session.exec(select(TryonTask)).all()
        if t.person_image_url and t.person_image_url != "deleted"
    )

    paginator = client.get_paginator("list_objects_v2")
    deleted_count = 0
    for page in paginator.paginate(Bucket=bucket, Prefix="person-images/"):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            last_modified: datetime = obj["LastModified"]
            if last_modified.tzinfo is None:
                last_modified = last_modified.replace(tzinfo=timezone.utc)

            if key not in known_keys and last_modified < cutoff:
                _delete_s3_key(client, bucket, key)
                print(f"  孤立圖刪除: {key}")
                deleted_count += 1

    return deleted_count


def main():
    print(f"[{datetime.now(timezone.utc).isoformat()}] 開始清洗...")
    client = _get_client()
    ensure_bucket()
    bucket = _bucket()

    with Session(engine) as session:
        task_count = cleanup_old_tasks(client, bucket, session)
        print(f"Block A：處理 {task_count} 筆超過 {TASK_RETENTION_DAYS} 天的 TryonTask")

        orphan_count = cleanup_orphan_person_images(client, bucket, session)
        print(f"Block B：刪除 {orphan_count} 張孤立的 person-images/")

    print(f"[{datetime.now(timezone.utc).isoformat()}] 清洗完成。")


if __name__ == "__main__":
    main()
