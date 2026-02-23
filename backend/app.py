"""
FastAPI application initialization and dashboard registration
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

# In Docker, we're at /app with a flat structure (dashboards/, config.py, etc.)
# Locally, we import from backend.*
# Try flat imports first, fall back to backend.* namespace imports.
try:
    from dashboards.registry import get_registry
    from config import close_all_connections
except ImportError:
    from backend.dashboards.registry import get_registry
    from backend.config import close_all_connections

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on env in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    registry = get_registry()
    return {
        "status": "healthy",
        "version": "0.1.0",
        "dashboards_count": len(registry.dashboards)
    }


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
