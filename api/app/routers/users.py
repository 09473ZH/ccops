from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.schemas.auth import UserInfo
from app.schemas.common import ApiResponse
from app.services.auth import AuthService
from app.models.user import User

router = APIRouter(prefix="/users", tags=["用户"])
security = HTTPBearer()


# 依赖函数
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """获取当前认证用户"""
    return await AuthService.get_current_user(credentials.credentials)


@router.get("/me", response_model=ApiResponse[UserInfo], summary="获取当前用户信息")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前登录用户的详细信息"""
    result = UserInfo.model_validate(current_user)
    return ApiResponse(data=result)