import pytest
from pytest_mock import MockerFixture
from fastapi import FastAPI

from app.core.database import init_db, close_db
from app.core.config import settings


def test_init_db_function_exists():
    """测试数据库初始化函数存在"""
    assert callable(init_db)


def test_close_db_function_exists():
    """测试数据库关闭函数存在"""
    assert callable(close_db)


def test_init_db_calls_register_tortoise(mocker: MockerFixture):
    """测试init_db调用register_tortoise"""
    app = FastAPI()
    
    mock_register = mocker.patch('app.core.database.register_tortoise')
    
    init_db(app)
    
    mock_register.assert_called_once()
    
    # 验证调用参数
    call_args = mock_register.call_args
    assert call_args[1]['db_url'] == settings.database_url
    assert call_args[1]['modules'] == {"models": ["app.models.host"]}
    assert call_args[1]['generate_schemas'] is True
    assert call_args[1]['add_exception_handlers'] is True


@pytest.mark.asyncio
async def test_close_db_calls_tortoise_close(mocker: MockerFixture):
    """测试close_db调用Tortoise关闭连接"""
    mock_close = mocker.patch('tortoise.Tortoise.close_connections')
    
    await close_db()
    
    mock_close.assert_called_once()