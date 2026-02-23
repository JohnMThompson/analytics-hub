"""
Shared pytest configuration for backend tests.
"""
import os


# Provide safe defaults so app import/registry initialization works in CI
# without requiring real database credentials.
os.environ.setdefault("DB_MORTGAGE_HOST", "ci-mock-host")
os.environ.setdefault("DB_MORTGAGE_USER", "ci-mock-user")
os.environ.setdefault("DB_MORTGAGE_PASSWORD", "ci-mock-password")
os.environ.setdefault("DB_MORTGAGE_NAME", "ci-mock-db")
os.environ.setdefault("DB_MORTGAGE_PORT", "3306")

# Keep optional dashboards disabled by default for test stability.
os.environ.setdefault("ENABLE_SWIM_DASHBOARD", "false")
