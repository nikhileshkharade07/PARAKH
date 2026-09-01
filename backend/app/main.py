from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.api.router import api_router
from app.database.session import SessionLocal

app = FastAPI(
    title="PARAKH API",
    description="AI-powered public procurement risk screening, anomaly detection, and audit support.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root-level health for backward compatibility
@app.get("/health")
def root_health():
    return {"status": "ok", "service": "parakh-api"}

@app.get("/ready")
def root_ready():
    return check_readiness()

# API-level health and readiness endpoints
@app.get(f"{settings.api_prefix}/health")
def api_health():
    return {
        "status": "ok",
        "service": "PARAKH backend"
    }

@app.get(f"{settings.api_prefix}/ready")
def api_ready():
    return check_readiness()

def check_readiness():
    db_status = "ok"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        db_status = "unavailable"
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "service": "PARAKH backend",
                "database": "unavailable"
            }
        )
    return {
        "status": "ready",
        "service": "PARAKH backend",
        "database": db_status
    }

# Include API Router
app.include_router(api_router, prefix=settings.api_prefix)

# Centralized Error Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed",
                "details": exc.errors()
            }
        }
    )
