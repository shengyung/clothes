from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.config import settings
from app.db import create_db_and_tables
from app.seed import seed_garments

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    seed_garments()
    yield


app = FastAPI(title="Virtual Try-On API", version="0.1.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
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
    return {"status": "ok", "git_sha": settings.git_sha}
