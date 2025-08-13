from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, Dict, List
from datetime import datetime
from .host import BaseSchema


class ConfigurationBase(BaseSchema):
    """配置基础Schema"""
    type: str = Field(..., description="配置类型分类")
    field_name: str = Field(..., description="配置字段名")
    field_value: Optional[str] = Field(None, description="配置字段值")
    field_description: Optional[str] = Field(None, description="配置字段描述")
    is_changed: bool = Field(default=False, description="是否已修改")


class ConfigurationCreate(ConfigurationBase):
    """创建配置Schema"""
    pass


class ConfigurationUpdate(BaseModel):
    """更新配置Schema"""
    field_value: Optional[str] = Field(None, description="配置字段值")
    field_description: Optional[str] = Field(None, description="配置字段描述")
    is_changed: Optional[bool] = Field(None, description="是否已修改")


class ConfigurationSchema(ConfigurationBase):
    """配置响应Schema"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ConfigurationListResponse(BaseModel):
    """配置列表响应Schema"""
    list: List[ConfigurationSchema]
    count: int


class ConfigurationBatchUpdate(BaseModel):
    """批量更新配置Schema"""
    configurations: List[Dict[str, Any]] = Field(..., description="配置列表，格式: [{'type': 'xxx', 'field_name': 'xxx', 'field_value': 'xxx'}]")


class PublicConfigurationResponse(BaseModel):
    """公开配置响应Schema"""
    configurations: Dict[str, Any] = Field(..., description="公开配置键值对")


