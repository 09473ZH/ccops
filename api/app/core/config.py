from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()


class Settings(BaseSettings):
    app_name: str = "CCOPS API"
    debug: bool = False
    
    # 数据库配置 - 从环境变量读取 
    database_url: str = os.getenv(
        "DATABASE_URL", 
        "postgres://root:password@localhost:5432/ccops"
    )
    old_database_url: str = os.getenv(
        "OLD_DATABASE_URL", 
        ""
    )
    
    # JWT 配置 - 从环境变量读取
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", 
        "your-secret-key-change-in-production"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # 数据库连接池配置
    db_min_connections: int = 1
    db_max_connections: int = 5
    db_timeout: int = 30
    db_pool_recycle: int = 3600

    class Config:
        env_file = ".env"


settings = Settings()