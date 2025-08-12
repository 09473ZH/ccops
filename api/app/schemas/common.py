from __future__ import annotations

from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar('T')


class ApiResponse(BaseModel, Generic[T]):
    """统一API响应格式"""
    code: int = 0  # 0 表示成功
    data: T
    msg: str = "success"


class ErrorResponse(BaseModel):
    """错误响应格式"""
    code: int = -1
    data: None = None
    msg: str