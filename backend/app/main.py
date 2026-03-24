from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import create_db_and_tables
from app.seed import seed_garments


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    seed_garments()
    yield


app = FastAPI(title="Virtual Try-On API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import auth, garments, tryon, upload  # noqa: E402

app.include_router(auth.router, prefix="/api")
app.include_router(garments.router, prefix="/api")
app.include_router(tryon.router, prefix="/api")
app.include_router(upload.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
