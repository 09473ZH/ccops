from tortoise import Tortoise
from tortoise.contrib.fastapi import register_tortoise
from fastapi import FastAPI

from app.core.config import settings


def init_db(app: FastAPI) -> None:
    """初始化数据库连接"""
    register_tortoise(
        app,
        db_url=settings.database_url,
        modules={"models": ["app.models.host", "app.models.user", "app.models.annotation"]},
        generate_schemas=True,
        add_exception_handlers=True,
    )


async def close_db() -> None:
    """关闭数据库连接"""
    await Tortoise.close_connections()