"""
Configuration management for database connections and app settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine, Engine
from sqlalchemy.pool import QueuePool
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Environment
    environment: str = "development"
    debug: bool = True
    
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
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"  # Allow extra fields from .env
    )


# Load settings
settings = Settings()

# Connection pool cache
_engines: Dict[str, Engine] = {}


def get_db_connection_string(database: str) -> str:
    """
    Generate MySQL connection string for a specific database
    
    Args:
        database: 'mortgage', 'swim', etc.
    
    Returns:
        SQLAlchemy-compatible connection string
    """
    if database == "mortgage":
        return (
            f"mysql+pymysql://{settings.db_mortgage_user}:"
            f"{settings.db_mortgage_password}@"
            f"{settings.db_mortgage_host}:{settings.db_mortgage_port}/"
            f"{settings.db_mortgage_name}"
        )
    elif database == "swim":
        if not all([settings.db_swim_host, settings.db_swim_user, settings.db_swim_name]):
            raise ValueError("Swim database credentials not configured")
        return (
            f"mysql+pymysql://{settings.db_swim_user}:"
            f"{settings.db_swim_password}@"
            f"{settings.db_swim_host}:{settings.db_swim_port}/"
            f"{settings.db_swim_name}"
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
        return {
            "host": settings.db_mortgage_host,
            "user": settings.db_mortgage_user,
            "password": settings.db_mortgage_password,
            "database": settings.db_mortgage_name,
            "port": settings.db_mortgage_port
        }
    elif database == "swim":
        return {
            "host": settings.db_swim_host,
            "user": settings.db_swim_user,
            "password": settings.db_swim_password,
            "database": settings.db_swim_name,
            "port": settings.db_swim_port
        }
    else:
        raise ValueError(f"Unknown database: {database}")


def close_all_connections():
    """Close all database connections"""
    for database, engine in _engines.items():
        engine.dispose()
        logger.info(f"Closed connection pool for {database} database")
