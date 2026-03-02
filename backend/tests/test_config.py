"""
Tests for configuration helpers.
"""

try:
    import config as config_module
except ImportError:
    import backend.config as config_module


def test_get_cors_allowed_origins_wildcard(monkeypatch):
    monkeypatch.setattr(config_module.settings, "cors_allowed_origins", "*", raising=False)
    assert config_module.get_cors_allowed_origins() == ["*"]


def test_get_cors_allowed_origins_csv(monkeypatch):
    monkeypatch.setattr(
        config_module.settings,
        "cors_allowed_origins",
        "https://analytics.example.com, https://admin.example.com",
        raising=False,
    )
    assert config_module.get_cors_allowed_origins() == [
        "https://analytics.example.com",
        "https://admin.example.com",
    ]
