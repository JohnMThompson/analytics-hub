"""
FastAPI application initialization and dashboard registration
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from contextlib import asynccontextmanager
from sqlalchemy import text
import time
import uuid

# In Docker, we're at /app with a flat structure (dashboards/, config.py, etc.)
# Locally, we import from backend.*
# Try flat imports first, fall back to backend.* namespace imports.
try:
    from dashboards.registry import get_registry
    from config import (
        close_all_connections,
        configure_logging,
        get_cors_allowed_origins,
    )
except ImportError:
    from backend.dashboards.registry import get_registry
    from backend.config import (
        close_all_connections,
        configure_logging,
        get_cors_allowed_origins,
    )

configure_logging()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Application lifecycle management."""
    logger.info(f"Started with {len(registry.dashboards)} dashboards")
    yield
    close_all_connections()
    logger.info("Closed all database connections")


app = FastAPI(
    title="AI Analytics API",
    description="Modular analytics dashboard platform",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS for frontend communication
allowed_origins = get_cors_allowed_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allowed_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request, call_next):
    """Log each request with a request ID and duration."""
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.exception(
            "request_failed request_id=%s method=%s path=%s duration_ms=%s",
            request_id,
            request.method,
            request.url.path,
            duration_ms,
        )
        raise

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    response.headers["x-request-id"] = request_id
    logger.info(
        "request_completed request_id=%s method=%s path=%s status=%s duration_ms=%s",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    registry = get_registry()
    return {
        "status": "healthy",
        "version": "0.1.0",
        "dashboards_count": len(registry.dashboards)
    }


@app.get("/api/ready")
async def readiness_check():
    """Readiness check endpoint including per-dashboard DB connectivity."""
    checks = {}
    all_ready = True

    for dashboard_id, dashboard in registry.dashboards.items():
        engine = getattr(dashboard, "engine", None)
        if engine is None:
            checks[dashboard_id] = {
                "ready": False,
                "error": "No database engine configured"
            }
            all_ready = False
            continue

        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            checks[dashboard_id] = {"ready": True}
        except Exception as error:
            logger.warning("readiness_check_failed dashboard_id=%s error=%s", dashboard_id, error)
            checks[dashboard_id] = {"ready": False, "error": str(error)}
            all_ready = False

    payload = {
        "status": "ready" if all_ready else "not_ready",
        "dashboards_count": len(registry.dashboards),
        "checks": checks
    }
    if all_ready:
        return payload
    return JSONResponse(status_code=503, content=payload)


@app.get("/api/dashboards")
async def list_dashboards():
    """
    Discover and return metadata for all registered dashboards
    """
    registry = get_registry()
    return {
        "dashboards": registry.get_metadata(),
        "total": len(registry.dashboards)
    }


# Initialize registry and include routers
registry = get_registry()
app.include_router(registry.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
