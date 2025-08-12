import pytest
from app.core.config import Settings, settings


def test_settings_instance():
    """测试配置实例"""
    assert isinstance(settings, Settings)


def test_app_name():
    """测试应用名称"""
    assert settings.app_name == "CCOPS API"


def test_database_url():
    """测试数据库URL配置"""
    assert settings.database_url.startswith("postgres://")
    assert "corgi.plus:5433" in settings.database_url
    assert "ccops" in settings.database_url


def test_database_connection_pool_config():
    """测试数据库连接池配置"""
    assert settings.db_min_connections == 1
    assert settings.db_max_connections == 5
    assert settings.db_timeout == 30
    assert settings.db_pool_recycle == 3600


def test_jwt_config():
    """测试JWT配置"""
    assert settings.algorithm == "HS256"
    assert settings.access_token_expire_minutes == 30
    assert len(settings.secret_key) > 0


def test_debug_mode():
    """测试调试模式"""
    assert isinstance(settings.debug, bool)


def test_env_file_config():
    """测试环境文件配置"""
    # 验证Settings类有Config内部类
    assert hasattr(Settings, "Config")
    assert hasattr(Settings.Config, "env_file")
    assert Settings.Config.env_file == ".env"