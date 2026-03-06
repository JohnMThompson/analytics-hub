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


def test_get_db_config_dakota(monkeypatch):
    monkeypatch.setattr(config_module.settings, "db_dakota_host", "mysql.example.com", raising=False)
    monkeypatch.setattr(config_module.settings, "db_dakota_user", "dakota_read", raising=False)
    monkeypatch.setattr(config_module.settings, "db_dakota_password", "secret", raising=False)
    monkeypatch.setattr(config_module.settings, "db_dakota_name", "dakota", raising=False)
    monkeypatch.setattr(config_module.settings, "db_dakota_port", 3306, raising=False)

    cfg = config_module.get_db_config("dakota")
    assert cfg["host"] == "mysql.example.com"
    assert cfg["user"] == "dakota_read"
    assert cfg["database"] == "dakota"


def test_get_db_connection_string_dakota(monkeypatch):
    monkeypatch.setattr(config_module.settings, "db_dakota_host", "mysql.example.com", raising=False)
    monkeypatch.setattr(config_module.settings, "db_dakota_user", "dakota_read", raising=False)
    monkeypatch.setattr(config_module.settings, "db_dakota_password", "secret", raising=False)
    monkeypatch.setattr(config_module.settings, "db_dakota_name", "dakota", raising=False)
    monkeypatch.setattr(config_module.settings, "db_dakota_port", 3306, raising=False)

    conn_str = config_module.get_db_connection_string("dakota")
    assert conn_str == "mysql+pymysql://dakota_read:secret@mysql.example.com:3306/dakota"
