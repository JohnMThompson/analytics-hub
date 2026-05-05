"""
FastAPI application initialization and dashboard registration
"""
import json
from urllib.parse import urlsplit, urlunsplit
from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse, JSONResponse
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
        settings,
    )
except ImportError:
    from backend.dashboards.registry import get_registry
    from backend.config import (
        close_all_connections,
        configure_logging,
        get_cors_allowed_origins,
        settings,
    )

configure_logging()

logger = logging.getLogger(__name__)
registry = get_registry()


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Application lifecycle management."""
    logger.info(f"Started with {len(registry.dashboards)} dashboards")
    yield
    close_all_connections()
    logger.info("Closed all database connections")


app = FastAPI(
    title="Analytics & Reporting Hub API",
    description="API definitions for the Analytics Hub",
    version="0.1.0",
    lifespan=lifespan,
    openapi_tags=registry.get_openapi_tags(),
    docs_url=None,
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


def get_frontend_base_url(request: Request) -> str:
    """Resolve the frontend origin for docs navigation links."""
    configured = (getattr(settings, "frontend_base_url", None) or "").strip()
    if configured:
        return configured.rstrip("/")

    url = urlsplit(str(request.base_url))
    hostname = url.hostname or ""
    port = url.port

    if hostname in {"localhost", "127.0.0.1"} and port == 8000:
        netloc = f"{hostname}:3000"
        return urlunsplit((url.scheme, netloc, "", "", "")).rstrip("/")

    return str(request.base_url).rstrip("/")


def build_custom_docs_html(request: Request) -> str:
    """Render Swagger UI with app-level navigation back to the frontend."""
    swagger_html = get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} - Swagger UI",
    )
    frontend_base_url = get_frontend_base_url(request)
    dashboard_links = json.dumps(registry.get_docs_dashboard_links())
    home_url = f"{frontend_base_url}/"

    enhancement = f"""
<style>
  .codex-docs-header-actions {{
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin: 0.75rem 0 1.5rem;
  }}
  .codex-docs-link {{
    color: #1f2937;
    text-decoration: none;
    font-weight: 600;
    border: 1px solid rgba(15, 23, 42, 0.18);
    border-radius: 999px;
    padding: 0.45rem 0.85rem;
    line-height: 1;
    background: #fff;
  }}
  .codex-docs-link:hover {{
    background: #f8fafc;
  }}
  .codex-docs-link--section {{
    color: #0f172a;
    border-color: rgba(15, 23, 42, 0.18);
    margin-left: auto;
    font-size: 0.875rem;
  }}
  .codex-docs-tag-row {{
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }}
</style>
<script>
  window.addEventListener("load", function () {{
    var frontendBaseUrl = {json.dumps(frontend_base_url)};
    var homeUrl = {json.dumps(home_url)};
    var dashboardLinks = {dashboard_links};
    var titleToDashboard = new Map(
      dashboardLinks.map(function (dashboard) {{
        return [dashboard.title, dashboard];
      }})
    );

    function ensureHeaderLink() {{
      var info = document.querySelector(".swagger-ui .information-container .info");
      if (!info || document.querySelector('[data-docs-home-link="true"]')) {{
        return;
      }}

      var actions = info.querySelector(".codex-docs-header-actions");
      if (!actions) {{
        actions = document.createElement("div");
        actions.className = "codex-docs-header-actions";

        var openApiLink = info.querySelector("a[href$='openapi.json']");
        if (openApiLink && openApiLink.parentNode === info) {{
          openApiLink.insertAdjacentElement("afterend", actions);
        }} else {{
          info.appendChild(actions);
        }}
      }}

      var link = document.createElement("a");
      link.href = homeUrl;
      link.textContent = "Back to Analytics Hub";
      link.className = "codex-docs-link";
      link.setAttribute("data-docs-home-link", "true");
      actions.appendChild(link);
    }}

    function ensureDashboardSectionLinks() {{
      document.querySelectorAll(".swagger-ui .opblock-tag-section").forEach(function (section) {{
        var header = section.querySelector(".opblock-tag");
        if (!header) {{
          return;
        }}

        var titleNode = header.querySelector("a.nostyle span") || header.querySelector("span");
        var title = titleNode ? titleNode.textContent.trim() : "";
        var dashboard = titleToDashboard.get(title);
        if (!dashboard || header.querySelector('[data-dashboard-link="true"]')) {{
          return;
        }}

        header.classList.add("codex-docs-tag-row");

        var link = document.createElement("a");
        link.href = frontendBaseUrl + "/dashboard/" + dashboard.id;
        link.textContent = "Open dashboard";
        link.className = "codex-docs-link codex-docs-link--section";
        link.setAttribute("data-dashboard-link", "true");
        header.appendChild(link);
      }});
    }}

    function enhanceDocs() {{
      ensureHeaderLink();
      ensureDashboardSectionLinks();
    }}

    enhanceDocs();

    var observer = new MutationObserver(enhanceDocs);
    observer.observe(document.body, {{ childList: true, subtree: true }});
  }});
</script>
"""

    return swagger_html.body.decode("utf-8").replace("</body>", f"{enhancement}</body>")


@app.get("/docs", include_in_schema=False)
async def overridden_swagger(request: Request):
    """Serve Swagger UI with links back to the frontend experience."""
    return HTMLResponse(build_custom_docs_html(request))


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


@app.get("/api/health", tags=["General"])
async def health_check():
    """Health check endpoint"""
    registry = get_registry()
    return {
        "status": "healthy",
        "version": "0.1.0",
        "dashboards_count": len(registry.dashboards)
    }


@app.get("/api/ready", tags=["General"])
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


@app.get("/api/dashboards", tags=["General"])
async def list_dashboards():
    """
    Discover and return metadata for all registered dashboards
    """
    registry = get_registry()
    return {
        "dashboards": registry.get_metadata(),
        "total": len(registry.dashboards)
    }


app.include_router(registry.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
