"""
Configuration management for database connections and app settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine, Engine
from sqlalchemy.pool import QueuePool
from typing import Optional, Dict, List
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Environment
    environment: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    cors_allowed_origins: str = "*"
    frontend_base_url: Optional[str] = None
    enable_mortgage_dashboard: bool = True
    enable_swim_dashboard: bool = True
    enable_rpi_dashboard: bool = True
    enable_halloween_dashboard: bool = True
    enable_dakota_dashboard: bool = True
    
    # Mortgage Database (required at runtime, but optional for testing)
    db_mortgage_host: Optional[str] = None
    db_mortgage_user: Optional[str] = None
    db_mortgage_password: Optional[str] = None
    db_mortgage_name: Optional[str] = None
    db_mortgage_port: int = 3306
    
    # Swim Database (optional, for future dashboards)
    db_swim_host: Optional[str] = None
    db_swim_user: Optional[str] = None
    db_swim_password: Optional[str] = None
    db_swim_name: Optional[str] = None
    db_swim_port: int = 3306

    # Raspberry Pi temperature database.
    # If omitted, falls back to mortgage host/user/password with db name "rpi".
    db_rpi_host: Optional[str] = None
    db_rpi_user: Optional[str] = None
    db_rpi_password: Optional[str] = None
    db_rpi_name: Optional[str] = None
    db_rpi_port: int = 3306

    # Halloween Database
    db_halloween_host: Optional[str] = None
    db_halloween_user: Optional[str] = None
    db_halloween_password: Optional[str] = None
    db_halloween_name: Optional[str] = None
    db_halloween_port: int = 3306

    # Dakota Database
    db_dakota_host: Optional[str] = None
    db_dakota_user: Optional[str] = None
    db_dakota_password: Optional[str] = None
    db_dakota_name: Optional[str] = None
    db_dakota_port: int = 3306
    
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        case_sensitive=False,
        extra="ignore"  # Allow extra fields from .env
    )


# Load settings
settings = Settings()

# Connection pool cache
_engines: Dict[str, Engine] = {}


def _resolve_rpi_settings() -> Dict[str, Optional[str]]:
    """Resolve RPI DB settings with fallback to mortgage credentials."""
    return {
        "host": settings.db_rpi_host or settings.db_mortgage_host,
        "user": settings.db_rpi_user or settings.db_mortgage_user,
        "password": settings.db_rpi_password or settings.db_mortgage_password,
        "name": settings.db_rpi_name or "rpi",
        "port": settings.db_rpi_port or settings.db_mortgage_port,
    }


def configure_logging() -> None:
    """Configure application-wide logging."""
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        force=True,
    )


def get_cors_allowed_origins() -> List[str]:
    """
    Parse configured CORS origins.

    Supports:
    - "*" (default) for permissive local/dev usage
    - comma-separated origins for stricter production setups
    """
    raw_value = (settings.cors_allowed_origins or "*").strip()
    if raw_value == "*":
        return ["*"]
    origins = [origin.strip() for origin in raw_value.split(",") if origin.strip()]
    return origins or ["*"]


def _validate_required_settings(database: str) -> None:
    """Validate required DB settings for a given database key."""
    if database == "mortgage":
        required = {
            "DB_MORTGAGE_HOST": settings.db_mortgage_host,
            "DB_MORTGAGE_USER": settings.db_mortgage_user,
            "DB_MORTGAGE_NAME": settings.db_mortgage_name,
        }
    elif database == "swim":
        required = {
            "DB_SWIM_HOST": settings.db_swim_host,
            "DB_SWIM_USER": settings.db_swim_user,
            "DB_SWIM_NAME": settings.db_swim_name,
        }
    elif database == "rpi":
        rpi = _resolve_rpi_settings()
        required = {
            "DB_RPI_HOST (or DB_MORTGAGE_HOST)": rpi["host"],
            "DB_RPI_USER (or DB_MORTGAGE_USER)": rpi["user"],
            "DB_RPI_NAME": rpi["name"],
        }
    elif database == "halloween":
        required = {
            "DB_HALLOWEEN_HOST": settings.db_halloween_host,
            "DB_HALLOWEEN_USER": settings.db_halloween_user,
            "DB_HALLOWEEN_NAME": settings.db_halloween_name,
        }
    elif database == "dakota":
        required = {
            "DB_DAKOTA_HOST": settings.db_dakota_host,
            "DB_DAKOTA_USER": settings.db_dakota_user,
            "DB_DAKOTA_NAME": settings.db_dakota_name,
        }
    else:
        raise ValueError(f"Unknown database: {database}")

    missing = [name for name, value in required.items() if not value]
    if missing:
        raise ValueError(
            f"{database} database credentials not configured: missing {', '.join(missing)}"
        )


def is_database_enabled(database: str) -> bool:
    """
    Check whether a dashboard/database integration is enabled.
    Unknown dashboard types default to enabled.
    """
    attr = f"enable_{database}_dashboard"
    return bool(getattr(settings, attr, True))


def get_db_connection_string(database: str) -> str:
    """
    Generate MySQL connection string for a specific database
    
    Args:
        database: 'mortgage', 'swim', etc.
    
    Returns:
        SQLAlchemy-compatible connection string
    """
    if database == "mortgage":
        _validate_required_settings("mortgage")
        return (
            f"mysql+pymysql://{settings.db_mortgage_user}:"
            f"{settings.db_mortgage_password}@"
            f"{settings.db_mortgage_host}:{settings.db_mortgage_port}/"
            f"{settings.db_mortgage_name}"
        )
    elif database == "swim":
        _validate_required_settings("swim")
        return (
            f"mysql+pymysql://{settings.db_swim_user}:"
            f"{settings.db_swim_password}@"
            f"{settings.db_swim_host}:{settings.db_swim_port}/"
            f"{settings.db_swim_name}"
        )
    elif database == "rpi":
        _validate_required_settings("rpi")
        rpi = _resolve_rpi_settings()
        return (
            f"mysql+pymysql://{rpi['user']}:"
            f"{rpi['password']}@"
            f"{rpi['host']}:{rpi['port']}/"
            f"{rpi['name']}"
        )
    elif database == "halloween":
        _validate_required_settings("halloween")
        return (
            f"mysql+pymysql://{settings.db_halloween_user}:"
            f"{settings.db_halloween_password}@"
            f"{settings.db_halloween_host}:{settings.db_halloween_port}/"
            f"{settings.db_halloween_name}"
        )
    elif database == "dakota":
        _validate_required_settings("dakota")
        return (
            f"mysql+pymysql://{settings.db_dakota_user}:"
            f"{settings.db_dakota_password}@"
            f"{settings.db_dakota_host}:{settings.db_dakota_port}/"
            f"{settings.db_dakota_name}"
        )
    else:
        raise ValueError(f"Unknown database: {database}")


def get_db_engine(database: str) -> Engine:
    """
    Get or create SQLAlchemy engine for a specific database
    Uses connection pooling for efficiency
    
    Args:
        database: 'mortgage', 'swim', etc.
    
    Returns:
        SQLAlchemy Engine with connection pool
    """
    if database not in _engines:
        connection_string = get_db_connection_string(database)
        _engines[database] = create_engine(
            connection_string,
            poolclass=QueuePool,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,  # Verify connections before using
            echo=settings.debug
        )
        logger.info(f"Created connection pool for {database} database")
    return _engines[database]


def get_db_config(database: str) -> dict:
    """
    Get database configuration dict for a specific database
    
    Args:
        database: 'mortgage', 'swim', etc.
    
    Returns:
        Dictionary with connection details
    """
    if database == "mortgage":
        _validate_required_settings("mortgage")
        return {
            "host": settings.db_mortgage_host,
            "user": settings.db_mortgage_user,
            "password": settings.db_mortgage_password,
            "database": settings.db_mortgage_name,
            "port": settings.db_mortgage_port
        }
    elif database == "swim":
        _validate_required_settings("swim")
        return {
            "host": settings.db_swim_host,
            "user": settings.db_swim_user,
            "password": settings.db_swim_password,
            "database": settings.db_swim_name,
            "port": settings.db_swim_port
        }
    elif database == "rpi":
        _validate_required_settings("rpi")
        rpi = _resolve_rpi_settings()
        return {
            "host": rpi["host"],
            "user": rpi["user"],
            "password": rpi["password"],
            "database": rpi["name"],
            "port": rpi["port"],
        }
    elif database == "halloween":
        _validate_required_settings("halloween")
        return {
            "host": settings.db_halloween_host,
            "user": settings.db_halloween_user,
            "password": settings.db_halloween_password,
            "database": settings.db_halloween_name,
            "port": settings.db_halloween_port,
        }
    elif database == "dakota":
        _validate_required_settings("dakota")
        return {
            "host": settings.db_dakota_host,
            "user": settings.db_dakota_user,
            "password": settings.db_dakota_password,
            "database": settings.db_dakota_name,
            "port": settings.db_dakota_port,
        }
    else:
        raise ValueError(f"Unknown database: {database}")


def close_all_connections():
    """Close all database connections"""
    for database, engine in _engines.items():
        engine.dispose()
        logger.info(f"Closed connection pool for {database} database")
