from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from tortoise.expressions import Q

from app.models.host import Host
from app.schemas.host import (
    HostSchema, 
    HostSchemaWithRelations,
    HostListResponse
)
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/hosts", tags=["hosts"])


@router.get("", response_model=ApiResponse[HostListResponse])
async def get_host_list(
    page: int = Query(1, ge=1),
    limit: int = Query(0, ge=0),  # 0表示不限制，与Go版本对应
    key: Optional[str] = Query(None, description="搜索关键词"),
    labelIds: Optional[str] = Query(None, description="标签ID列表，逗号分隔，与Go版本对应"),
    logic: str = Query("and", description="标签逻辑，and 或 or"),
    withMetrics: bool = Query(False, description="是否包含监控数据")
):
    """获取主机列表"""
    from app.models.host import Disk
    
    # 构建基础查询 - 仅选择Go版本返回的字段
    query = Host.all().order_by("-created_at")  # 默认按创建时间降序
    
    # 关键词搜索 - 仅搜索name字段，与Go版本对应
    if key:
        query = query.filter(name__icontains=key)
    
    # 标签筛选 - 使用labelIds参数名，与Go版本对应
    if labelIds:
        try:
            label_id_list = [int(x.strip()) for x in labelIds.split(",") if x.strip()]
            if label_id_list:
                if logic == "and":
                    # 交集筛选
                    for label_id in label_id_list:
                        query = query.filter(annotations__id=label_id)
                else:
                    # 并集筛选
                    query = query.filter(annotations__id__in=label_id_list).distinct()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid labelIds format")
    
    # 计算总数
    total = await query.count()
    
    # 分页查询
    offset = (page - 1) * limit if limit > 0 else 0
    if limit > 0:
        hosts = await query.offset(offset).limit(limit).prefetch_related("annotations")
    else:
        hosts = await query.prefetch_related("annotations")
    
    # 批量获取磁盘信息
    host_ids = [host.id for host in hosts]
    disks = []
    if host_ids:
        disks = await Disk.filter(host_id__in=host_ids)
    
    # 构建磁盘映射
    disk_map = {}
    for disk in disks:
        if disk.host_id not in disk_map:
            disk_map[disk.host_id] = []
        disk_map[disk.host_id].append({
            "id": disk.id,
            "hostId": disk.host_id,
            "diskSpaceAvailable": disk.disk_space_available,
            "totalDiskSpace": disk.total_disk_space,
            "percentDiskSpaceAvailable": disk.percent_disk_space_available,
            "encrypted": disk.encrypted
        })
    
    # 转换为带关联数据的Schema
    host_list = []
    for host in hosts:
        host_data = HostSchemaWithRelations.model_validate(host)
        
        # 添加磁盘数据
        host_data.disk = disk_map.get(host.id, [])
        
        # 格式化标签数据 - 使用label字段名与Go版本对应
        formatted_labels = []
        for annotation in host.annotations:
            formatted_labels.append({
                "id": annotation.id,
                "name": annotation.name,
                "value": annotation.value,
                "namespace": annotation.namespace,
                "key": annotation.key,
                "createdAt": annotation.created_at.isoformat(),
                "updatedAt": annotation.updated_at.isoformat(),
            })
        host_data.label = formatted_labels
        
        # 监控数据（如果需要）
        if withMetrics:
            # TODO: 实现监控数据获取逻辑
            host_data.metrics = None
        
        host_list.append(host_data)
    
    result = HostListResponse(
        list=host_list,
        count=total
    )
    return ApiResponse(data=result)


@router.get("/search", response_model=ApiResponse[List[HostSchema]])
async def search_hosts(
    q: str = Query(..., description="搜索关键词"),
    limit: int = Query(10, ge=1, le=50)
):
    """搜索主机"""
    
    # 支持按ID、IP、主机名搜索
    search_condition = Q(name__icontains=q) | Q(primary_ip__icontains=q) | Q(public_ip__icontains=q)
    
    # 如果是数字，也按ID搜索
    if q.isdigit():
        search_condition |= Q(id=int(q))
    
    hosts = await Host.filter(search_condition).limit(limit)
    
    result = [HostSchema.model_validate(host) for host in hosts]
    return ApiResponse(data=result)


@router.get("/{host_id}", response_model=ApiResponse[HostSchema])
async def get_host_info(host_id: int):
    """获取单个主机详情"""
    
    host = await Host.filter(id=host_id).first()
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")
    
    result = HostSchema.model_validate(host)
    return ApiResponse(data=result)