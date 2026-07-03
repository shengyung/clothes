#!/usr/bin/env python3
"""
一次性清理 S3/MinIO 中所有非服裝的圖片。

保留：Garment.image_url（種子服裝圖）
刪除：
  - 所有 person-images/* 下的物件
  - images/* 下不屬於任何 Garment 的物件（舊試穿結果）
  - result-images/* 下所有物件（如果有的話）

同時將 TryonTask 的圖片欄位標記為已刪除。

用法：
    cd backend && python scripts/clear_s3.py
    加 --dry-run 只印出要刪的 key，不實際刪除
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlmodel import Session, select

from app.db import engine
from app.models import Garment, TryonTask
from app.storage import _bucket, _get_client, ensure_bucket


def list_all_objects(client, bucket: str, prefix: str) -> list[str]:
    keys = []
    paginator = client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            keys.append(obj["Key"])
    return keys


def clear_s3(dry_run: bool = False):
    client = _get_client()
    ensure_bucket()
    bucket = _bucket()

    with Session(engine) as session:
        garment_keys = set(
            g.image_url for g in session.exec(select(Garment)).all()
        )
        print(f"受保護的服裝圖片：{len(garment_keys)} 張")

        to_delete: list[str] = []

        # 刪除所有 person-images/
        person_keys = list_all_objects(client, bucket, "person-images/")
        to_delete.extend(person_keys)
        print(f"person-images/: {len(person_keys)} 個物件")

        # 刪除所有 result-images/
        result_keys = list_all_objects(client, bucket, "result-images/")
        to_delete.extend(result_keys)
        print(f"result-images/: {len(result_keys)} 個物件")

        # 刪除 images/ 下非服裝的物件（舊試穿結果）
        image_keys = list_all_objects(client, bucket, "images/")
        non_garment_images = [k for k in image_keys if k not in garment_keys]
        to_delete.extend(non_garment_images)
        print(f"images/（非服裝）: {len(non_garment_images)} 個物件")

        if not to_delete:
            print("沒有需要刪除的物件。")
            return

        print(f"\n總計要刪除：{len(to_delete)} 個物件")
        for key in to_delete:
            print(f"  DELETE {key}")

        if dry_run:
            print("\n[dry-run] 沒有實際刪除。")
            return

        confirm = input(f"\n確認刪除 {len(to_delete)} 個 S3 物件？(輸入 yes 確認): ").strip()
        if confirm != "yes":
            print("已取消。")
            return

        # S3 批次刪除（每次最多 1000 個）
        for i in range(0, len(to_delete), 1000):
            batch = to_delete[i:i + 1000]
            client.delete_objects(
                Bucket=bucket,
                Delete={"Objects": [{"Key": k} for k in batch]},
            )
        print(f"已刪除 {len(to_delete)} 個 S3 物件。")

        # 更新 DB：把已刪除圖片的 TryonTask 欄位標記
        tasks = session.exec(select(TryonTask)).all()
        updated = 0
        for task in tasks:
            changed = False
            if task.person_image_url and task.person_image_url != "deleted":
                task.person_image_url = "deleted"
                changed = True
            if task.result_image_url:
                task.result_image_url = None
                changed = True
            if changed:
                session.add(task)
                updated += 1

        session.commit()
        print(f"已更新 {updated} 筆 TryonTask 記錄。")
        print("完成。")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="只印出要刪的 key，不實際刪除")
    args = parser.parse_args()
    clear_s3(dry_run=args.dry_run)
