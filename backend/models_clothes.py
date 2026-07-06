"""
clothes 資料表的 SQLAlchemy model
貼到你的 backend/models.py 或 backend/models_clothes.py
"""
from sqlalchemy import Column, String, Text, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class ClothingItem(Base):
    __tablename__ = "clothes"

    id             = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name           = Column(String, nullable=False)
    category       = Column(String, nullable=False)   # 上衣、褲子、外套…
    color          = Column(String, nullable=True)
    material       = Column(String, nullable=True)
    pattern        = Column(String, nullable=True)
    brand          = Column(String, nullable=True)
    season         = Column(JSON,   nullable=True)    # ["春", "夏"]
    care           = Column(Text,   nullable=True)
    link           = Column(String, nullable=True)    # Google Drive 或其他連結
    image_base64   = Column(Text,   nullable=True)    # 壓縮後的 base64 圖片
    created_at     = Column(DateTime, default=datetime.utcnow)
