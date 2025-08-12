from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.schemas.auth import (
    LoginRequest, LoginResponse, RegisterRequest, UserInfo,
    ChangePasswordRequest, RefreshTokenRequest
)
from app.schemas.common import ApiResponse
from app.services.auth import AuthService
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["认证"])
security = HTTPBearer()


# 依赖函数
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """获取当前认证用户"""
    return await AuthService.get_current_user(credentials.credentials)


# 可选的认证依赖 - 允许未认证用户访问
async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False))
) -> User | None:
    """获取当前用户（可选）"""
    if not credentials:
        return None
    
    try:
        return await AuthService.get_current_user(credentials.credentials)
    except HTTPException:
        return None


# 管理员权限依赖
async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """获取当前管理员用户"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    return current_user


@router.post("/register", response_model=UserInfo, summary="用户注册")
async def register(request: RegisterRequest):
    """
    用户注册
    
    - **username**: 用户名（3-36字符，只能包含字母数字下划线横杠）
    - **email**: 邮箱地址
    - **password**: 密码（至少8位，必须包含字母和数字）
    """
    return await AuthService.register(request)


@router.post("/login", response_model=ApiResponse[LoginResponse], summary="用户登录")
async def login(request: LoginRequest, client_request: Request):
    """
    用户登录
    
    - **username**: 用户名或邮箱
    - **password**: 密码
    
    返回访问令牌和刷新令牌
    """
    result = await AuthService.login(request, client_request)
    return ApiResponse(data=result)


@router.post("/refresh", response_model=LoginResponse, summary="刷新令牌")
async def refresh_token(request: RefreshTokenRequest):
    """
    使用刷新令牌获取新的访问令牌
    
    - **refresh_token**: 刷新令牌
    """
    return await AuthService.refresh_token(request.refresh_token)


@router.post("/logout", summary="用户登出")
async def logout():
    """
    用户登出
    
    注意：由于使用JWT无状态认证，登出只需客户端删除令牌即可
    """
    return {"message": "登出成功"}


@router.get("/me", response_model=UserInfo, summary="获取当前用户信息")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前登录用户的信息"""
    return UserInfo.model_validate(current_user)


@router.post("/change-password", summary="修改密码")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    """
    修改密码
    
    - **old_password**: 原密码
    - **new_password**: 新密码（至少8位，必须包含字母和数字）
    """
    await AuthService.change_password(current_user.id, request)
    return {"message": "密码修改成功"}