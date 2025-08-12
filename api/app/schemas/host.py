from __future__ import annotations

from pydantic import BaseModel, Field
from datetime import datetime

def to_camel(string: str) -> str:
    """将下划线命名转换为驼峰命名"""
    components = string.split('_')
    return components[0] + ''.join(x.capitalize() for x in components[1:])

# 基础模型类，包含通用配置
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True
        alias_generator = to_camel
        populate_by_name = True

# 注解模型（层级格式）
class AnnotationSchemaForHost(BaseSchema):
    id: int
    name: str  # 如 "server/env"
    value: str  # 如 "prod"
    namespace: str | None = None  # 如 "server"
    key: str  # 如 "env"
    created_at: datetime
    updated_at: datetime

class HostUserSchema(BaseSchema):
    id: int
    host_id: int
    username: str
    group_name: str | None = None
    shell: str | None = None

class DiskSchema(BaseSchema):
    id: int
    host_id: int
    disk_space_available: float
    total_disk_space: float
    percent_disk_space_available: str
    encrypted: bool = False

class SoftwareSchema(BaseSchema):
    id: int
    host_id: int
    name: str
    version: str
    type: str

class HostSchema(BaseSchema):
    id: int
    created_at: datetime
    updated_at: datetime
    
    # 基本信息
    name: str
    operating_system: str | None = None
    status: int = 0
    
    # 时间信息
    fetch_time: datetime | None = None
    start_time: datetime | None = None
    
    # 连接信息
    agent: str | None = None
    host_server_url: str | None = None
    
    # 系统信息
    osquery_host_id: str | None = None
    osquery_version: str | None = None
    platform_like: str | None = None
    
    # 硬件信息
    cpu_type: str | None = None
    cpu_brand: str | None = None
    cpu_logical_cores: str | None = None
    cpu_physical_cores: str | None = None
    physical_memory: str | None = None
    
    # 网络信息
    primary_ip: str | None = None
    primary_mac: str | None = None
    public_ip: str | None = None
    country: str | None = None
    city: str | None = None

class HostSchemaWithRelations(HostSchema):
    annotations: list[AnnotationSchemaForHost] = []

# 请求和响应模型
class HostListRequest(BaseModel):
    page: int = 1
    limit: int = 20
    key: str | None = None
    annotation_ids: list[int] | None = None
    logic: str = "and"  # "and" or "or"
    with_metrics: bool = False


class HostListResponse(BaseModel):
    data: list[HostSchema]
    total: int
    page: int
    limit: int