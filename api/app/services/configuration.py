import json
from typing import Optional, Dict, Any, List
from tortoise.exceptions import DoesNotExist

from app.models.configuration import Configuration
from app.schemas.configuration import (
    ConfigurationCreate, 
    ConfigurationUpdate, 
    ConfigurationSchema,
    ConfigurationListResponse,
    ConfigurationBatchUpdate,
    PublicConfigurationResponse
)


class ConfigurationService:
    """配置服务"""

    @staticmethod
    async def get_configuration_by_type_and_name(type_: str, field_name: str) -> Optional[Configuration]:
        """根据类型和字段名获取配置"""
        try:
            return await Configuration.get(type=type_, field_name=field_name)
        except DoesNotExist:
            return None

    @staticmethod
    async def get_configuration_value(type_: str, field_name: str, default: Any = None) -> Any:
        """获取配置值"""
        config = await ConfigurationService.get_configuration_by_type_and_name(type_, field_name)
        if not config:
            return default
        return config.field_value or default

    @staticmethod
    async def create_configuration(request: ConfigurationCreate) -> ConfigurationSchema:
        """创建配置"""
        config = await Configuration.create(**request.model_dump())
        return ConfigurationSchema.model_validate(config)

    @staticmethod
    async def update_configuration(type_: str, field_name: str, request: ConfigurationUpdate) -> Optional[ConfigurationSchema]:
        """更新配置"""
        config = await ConfigurationService.get_configuration_by_type_and_name(type_, field_name)
        if not config:
            return None
        
        update_data = request.model_dump(exclude_unset=True)
        if update_data:
            await config.update_from_dict(update_data)
            await config.save()
        
        return ConfigurationSchema.model_validate(config)

    @staticmethod
    async def delete_configuration(type_: str, field_name: str) -> bool:
        """删除配置"""
        config = await ConfigurationService.get_configuration_by_type_and_name(type_, field_name)
        if not config:
            return False
        
        await config.delete()
        return True

    @staticmethod
    async def get_configurations_by_type(type_: Optional[str] = None) -> ConfigurationListResponse:
        """获取配置列表"""
        query = Configuration.all()
        
        if type_:
            query = query.filter(type=type_)
        
        configs = await query.all()
        config_list = [ConfigurationSchema.model_validate(config) for config in configs]
        
        return ConfigurationListResponse(
            list=config_list,
            count=len(config_list)
        )

    @staticmethod
    async def get_public_configurations() -> Dict[str, str]:
        """获取公开配置，以类型分组"""
        configs = await Configuration.all()
        
        result = {}
        for config in configs:
            if config.type not in result:
                result[config.type] = {}
            result[config.type][config.field_name] = config.field_value
        
        return result

    @staticmethod
    async def batch_update_configurations(request: ConfigurationBatchUpdate) -> int:
        """批量更新配置"""
        updated_count = 0
        
        for config_data in request.configurations:
            type_ = config_data.get("type")
            field_name = config_data.get("field_name")
            field_value = config_data.get("field_value")
            
            if not type_ or not field_name:
                continue
            
            config = await ConfigurationService.get_configuration_by_type_and_name(type_, field_name)
            if config:
                config.field_value = field_value
                config.is_changed = True
                await config.save()
                updated_count += 1
        
        return updated_count

    @staticmethod
    async def set_configuration(type_: str, field_name: str, field_value: str, 
                              field_description: str = None, is_changed: bool = False) -> ConfigurationSchema:
        """设置配置（如果存在则更新，不存在则创建）"""
        config = await ConfigurationService.get_configuration_by_type_and_name(type_, field_name)
        
        if config:
            # 更新现有配置
            config.field_value = field_value
            if field_description:
                config.field_description = field_description
            config.is_changed = is_changed
            await config.save()
        else:
            # 创建新配置
            config = await Configuration.create(
                type=type_,
                field_name=field_name,
                field_value=field_value,
                field_description=field_description,
                is_changed=is_changed
            )
        
        return ConfigurationSchema.model_validate(config)