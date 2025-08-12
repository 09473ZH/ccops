from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status, Request
from tortoise.exceptions import DoesNotExist, IntegrityError

from app.models.user import User, LoginLog, UserRole
from app.schemas.auth import (
    LoginRequest, LoginResponse, RegisterRequest, UserInfo,
    ChangePasswordRequest, TokenPayload
)
from app.utils.auth import AuthUtils, validate_password_strength
from app.core.config import settings


class AuthService:
    """认证服务"""
    
    @staticmethod
    async def register(request: RegisterRequest) -> UserInfo:
        """用户注册"""
        # 检查用户名是否存在
        if await User.filter(username=request.username).exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已存在"
            )
        
        # 检查邮箱是否存在
        if await User.filter(email=request.email).exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )
        
        # 创建用户
        try:
            user = await User.create(
                username=request.username,
                email=request.email,
                password_hash=AuthUtils.hash_password(request.password),
                role=UserRole.USER
            )
            return UserInfo.model_validate(user)
        except IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="创建用户失败"
            )
    
    @staticmethod
    async def login(request: LoginRequest, client_request: Request) -> LoginResponse:
        """用户登录"""
        # 查找用户 - 支持用户名或邮箱登录
        user = await User.filter(
            username=request.username
        ).first()
        
        if not user:
            # 尝试邮箱登录
            user = await User.filter(email=request.username).first()
        
        # 记录登录日志
        await AuthService._log_login_attempt(
            user, client_request, success=False, 
            failure_reason="用户不存在" if not user else None
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误"  # 不泄露用户是否存在
            )
        
        # 检查账户状态
        if not user.is_active:
            await AuthService._log_login_attempt(
                user, client_request, success=False, failure_reason="账户已禁用"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="账户已被禁用"
            )
        
        # 检查账户是否被锁定
        if user.is_locked:
            await AuthService._log_login_attempt(
                user, client_request, success=False, failure_reason="账户被锁定"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="账户因多次登录失败被暂时锁定，请30分钟后再试"
            )
        
        # 验证密码
        if not AuthUtils.verify_password(request.password, user.password_hash):
            await user.increment_failed_login()
            await AuthService._log_login_attempt(
                user, client_request, success=False, failure_reason="密码错误"
            )
            
            remaining_attempts = 5 - user.failed_login_count
            if remaining_attempts > 0:
                detail = f"用户名或密码错误，剩余尝试次数：{remaining_attempts}"
            else:
                detail = "密码错误次数过多，账户已被锁定30分钟"
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=detail
            )
        
        # 登录成功
        await user.increment_login_count()
        await AuthService._log_login_attempt(user, client_request, success=True)
        
        # 生成令牌
        access_token = AuthUtils.create_access_token(
            data={"sub": str(user.id), "username": user.username, "role": user.role}
        )
        refresh_token = AuthUtils.create_refresh_token(
            data={"sub": str(user.id)}
        )
        
        # 计算过期时间戳
        from datetime import datetime, timedelta
        expire_time = datetime.utcnow() + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expire_at=int(expire_time.timestamp()),
            user=UserInfo.model_validate(user)
        )
    
    @staticmethod
    async def refresh_token(refresh_token: str) -> LoginResponse:
        """刷新访问令牌"""
        try:
            payload = AuthUtils.verify_token(refresh_token)
            user_id = int(payload.get("sub"))
            
            user = await User.get(id=user_id)
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="账户已被禁用"
                )
            
            # 生成新的访问令牌
            access_token = AuthUtils.create_access_token(
                data={"sub": str(user.id), "username": user.username, "role": user.role}
            )
            
            # 计算过期时间戳
            expire_time = datetime.utcnow() + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
            
            return LoginResponse(
                access_token=access_token,
                refresh_token=refresh_token,  # 刷新令牌保持不变
                expire_at=int(expire_time.timestamp()),
                user=UserInfo.model_validate(user)
            )
            
        except DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户不存在"
            )
    
    @staticmethod
    async def change_password(user_id: int, request: ChangePasswordRequest) -> bool:
        """修改密码"""
        user = await User.get(id=user_id)
        
        # 验证旧密码
        if not AuthUtils.verify_password(request.old_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="原密码错误"
            )
        
        # 更新密码
        user.password_hash = AuthUtils.hash_password(request.new_password)
        await user.save(update_fields=["password_hash"])
        
        return True
    
    @staticmethod
    async def get_current_user(token: str) -> User:
        """获取当前用户"""
        user_id = AuthUtils.get_user_id_from_token(token)
        
        try:
            user = await User.get(id=user_id)
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="账户已被禁用"
                )
            return user
        except DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户不存在"
            )
    
    @staticmethod
    async def _log_login_attempt(
        user: Optional[User], 
        request: Request, 
        success: bool, 
        failure_reason: Optional[str] = None
    ):
        """记录登录尝试"""
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")
        
        await LoginLog.create(
            user_id=user.id if user else None,
            ip_address=client_ip,
            user_agent=user_agent,
            success=success,
            failure_reason=failure_reason
        )