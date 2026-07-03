from sqlalchemy import event
from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

_is_sqlite = settings.database_url.startswith("sqlite")

# FastAPI 同步 endpoint 會在 threadpool 裡執行，sqlite3 預設不允許跨 thread
# 共用同一個 connection，所以要關掉 check_same_thread 檢查。
# （之後升級 PostgreSQL 時，_is_sqlite 為 False，這段不會生效。）
connect_args = {"check_same_thread": False} if _is_sqlite else {}

engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)

if _is_sqlite:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        # WAL：讀取不會被寫入鎖住，併發情況下大幅降低 "database is locked"
        cursor.execute("PRAGMA journal_mode=WAL")
        # 真的撞到鎖的時候，等待最多 5 秒再重試，而不是直接拋錯
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
