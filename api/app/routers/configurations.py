from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional

from app.schemas.common import ApiResponse
from app.schemas.configuration import (
    ConfigurationCreate,
    ConfigurationUpdate, 
    ConfigurationSchema,
    ConfigurationListResponse,
    ConfigurationBatchUpdate
)
from app.services.configuration import ConfigurationService
from app.routers.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/configurations", tags=["configurations"])


@router.get("", response_model=ApiResponse[ConfigurationListResponse], summary="获取配置列表")
async def get_configurations(
    type: Optional[str] = Query(None, description="配置类型")
):
    """获取配置列表"""
    result = await ConfigurationService.get_configurations_by_type(type)
    return ApiResponse(data=result)


@router.get("/public", response_model=ApiResponse[dict], summary="获取公开配置")
async def get_public_configurations():
    """获取所有公开配置，以类型分组返回"""
    result = await ConfigurationService.get_public_configurations()
    return ApiResponse(data=result)


@router.get("/{type}/{field_name}", response_model=ApiResponse[ConfigurationSchema], summary="根据类型和字段名获取配置")
async def get_configuration_by_type_and_name(type: str, field_name: str):
    """根据类型和字段名获取单个配置"""
    config = await ConfigurationService.get_configuration_by_type_and_name(type, field_name)
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    result = ConfigurationSchema.model_validate(config)
    return ApiResponse(data=result)


@router.post("", response_model=ApiResponse[ConfigurationSchema], summary="创建配置")
async def create_configuration(
    request: ConfigurationCreate,
    current_user: User = Depends(get_current_user)
):
    """创建新配置"""
    # 检查类型和字段名是否已存在
    existing = await ConfigurationService.get_configuration_by_type_and_name(request.type, request.field_name)
    if existing:
        raise HTTPException(status_code=400, detail="Configuration already exists")
    
    result = await ConfigurationService.create_configuration(request)
    return ApiResponse(data=result)


@router.put("/{type}/{field_name}", response_model=ApiResponse[ConfigurationSchema], summary="更新配置")
async def update_configuration(
    type: str,
    field_name: str,
    request: ConfigurationUpdate,
    current_user: User = Depends(get_current_user)
):
    """更新配置"""
    result = await ConfigurationService.update_configuration(type, field_name, request)
    if not result:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    return ApiResponse(data=result)


@router.delete("/{type}/{field_name}", response_model=ApiResponse[dict], summary="删除配置")
async def delete_configuration(
    type: str,
    field_name: str,
    current_user: User = Depends(get_current_user)
):
    """删除配置"""
    success = await ConfigurationService.delete_configuration(type, field_name)
    if not success:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    return ApiResponse(data={"message": "Configuration deleted successfully"})


@router.post("/batch_update", response_model=ApiResponse[dict], summary="批量更新配置")
async def batch_update_configurations(
    request: ConfigurationBatchUpdate,
    current_user: User = Depends(get_current_user)
):
    """批量更新配置"""
    updated_count = await ConfigurationService.batch_update_configurations(request)
    return ApiResponse(data={"updated_count": updated_count})