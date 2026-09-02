import os
import sys
from contextlib import asynccontextmanager

# Ensure backend and root directory are in sys.path regardless of execution directory
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
root_dir = os.path.dirname(backend_dir)
for p in [backend_dir, root_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.database.session import engine
from app.models.base import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema exists on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="PARAKH API",
    description="AI-powered public procurement risk screening and audit support.",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.api_prefix)

@app.get("/health")
def health():
    return {"status": "ok", "service": "parakh-api"}

@app.get("/ready")
def ready():
    return {"status": "ready", "database": "ok"}

