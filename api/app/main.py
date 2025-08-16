from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时执行
    yield
    # 关闭时执行
    await close_db()


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化数据库
init_db(app)

# 注册路由
from app.routers import hosts_router
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.annotations import router as annotations_router
from app.routers.configurations import router as configurations_router
from app.routers.terminal import router as terminal_router
from app.routers.agent import router as agent_router
from app.routers.client import router as client_router

app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(annotations_router, prefix="/api")
app.include_router(configurations_router, prefix="/api")
app.include_router(hosts_router, prefix="/api")
app.include_router(terminal_router, prefix="/api")
app.include_router(agent_router, prefix="/api")
app.include_router(client_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Hello from CCOPS API!"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}