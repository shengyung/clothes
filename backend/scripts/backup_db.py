#!/usr/bin/env python3
"""
把目前的 SQLite 資料庫安全備份一份到 S3 / MinIO。

用 sqlite3 內建的 backup API（而不是直接 cp 檔案），確保即使有人正在寫入
（WAL mode 下），備份出來的檔案也是一致的快照，不會半寫壞掉。

用法：
    cd backend && python scripts/backup_db.py

建議在 EC2 上設定 cron，每天跑一次，例如每天凌晨 3 點：
    0 3 * * * cd /path/to/clothes/backend && /usr/bin/python3 scripts/backup_db.py >> /var/log/tryon_backup.log 2>&1

備份會上傳到目前設定的 bucket（USE_S3=true 時是 AWS S3，否則是本地 MinIO）下的
`backups/` 路徑，檔名帶時間戳記。

注意：這個腳本只適用於 SQLite。之後升級 PostgreSQL（RDS）後，
請改用 RDS 的自動備份/快照功能，不需要再跑這個腳本。
"""

import sqlite3
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings  # noqa: E402
from app.storage import _bucket, _get_client, ensure_bucket  # noqa: E402


def _sqlite_path_from_url(url: str) -> str:
    if not url.startswith("sqlite:///"):
        raise SystemExit(
            f"DATABASE_URL 不是 sqlite（目前是: {url}）。\n"
            "這個腳本只適用於 SQLite；PostgreSQL 請改用 RDS 自動備份。"
        )
    return url.replace("sqlite:///", "", 1)


def backup_to_s3() -> str:
    db_path = _sqlite_path_from_url(settings.database_url)
    if not Path(db_path).exists():
        raise SystemExit(f"找不到資料庫檔案: {db_path}")

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    key = f"backups/tryon-{timestamp}.db"

    with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
        # sqlite3 的 backup API：對運行中的資料庫做一致性快照，
        # 比直接 cp 安全（cp 在 WAL mode 下可能拷到不完整的檔案）。
        src = sqlite3.connect(db_path)
        dst = sqlite3.connect(tmp.name)
        with dst:
            src.backup(dst)
        src.close()
        dst.close()

        ensure_bucket()
        client = _get_client()
        client.upload_file(tmp.name, _bucket(), key)

    print(f"備份完成: s3://{_bucket()}/{key}")
    return key


if __name__ == "__main__":
    backup_to_s3()
