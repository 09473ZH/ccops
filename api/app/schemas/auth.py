from __future__ import annotations

from pydantic import BaseModel, Field, EmailStr, field_validator
from datetime import datetime
import re

from app.schemas.host import BaseSchema
from app.models.user import UserRole


class LoginRequest(BaseModel):
    """登录请求"""
    username: str = Field(..., min_length=1, max_length=36, description="用户名或邮箱")
    password: str = Field(..., min_length=1, description="密码")


class LoginResponse(BaseSchema):
    """登录响应"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expire_at: int  # 过期时间戳
    user: UserInfo


class RegisterRequest(BaseModel):
    """注册请求"""
    username: str = Field(..., min_length=3, max_length=36, description="用户名")
    email: EmailStr = Field(..., description="邮箱")
    password: str = Field(..., min_length=8, description="密码")
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        """验证用户名格式"""
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('用户名只能包含字母、数字、下划线和横杠')
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """验证密码复杂度"""
        if len(v) < 8:
            raise ValueError('密码长度至少8位')
        
        has_letter = re.search(r'[a-zA-Z]', v)
        has_number = re.search(r'[0-9]', v)
        
        if not (has_letter and has_number):
            raise ValueError('密码必须包含字母和数字')
        
        return v


class UserInfo(BaseSchema):
    """用户信息"""
    id: int
    username: str
    email: str | None = None
    role: UserRole
    is_active: bool
    is_verified: bool
    last_login: datetime | None = None
    login_count: int
    created_at: datetime


class UserCreate(BaseModel):
    """创建用户"""
    username: str = Field(..., min_length=3, max_length=36)
    email: EmailStr | None = None
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.USER
    is_active: bool = True


class UserUpdate(BaseModel):
    """更新用户"""
    email: EmailStr | None = None
    role: UserRole | None = None
    is_active: bool | None = None


class ChangePasswordRequest(BaseModel):
    """修改密码请求"""
    old_password: str = Field(..., description="旧密码")
    new_password: str = Field(..., min_length=8, description="新密码")
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v):
        """验证新密码复杂度"""
        if len(v) < 8:
            raise ValueError('密码长度至少8位')
        
        has_letter = re.search(r'[a-zA-Z]', v)
        has_number = re.search(r'[0-9]', v)
        
        if not (has_letter and has_number):
            raise ValueError('密码必须包含字母和数字')
        
        return v


class RefreshTokenRequest(BaseModel):
    """刷新令牌请求"""
    refresh_token: str


class TokenPayload(BaseModel):
    """JWT 载荷"""
    sub: str  # 用户ID
    username: str
    role: UserRole
    exp: int  # 过期时间戳