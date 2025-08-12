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
    limit: int = Query(20, ge=1, le=100),
    key: Optional[str] = Query(None, description="搜索关键词"),
    annotation_ids: Optional[str] = Query(None, description="注解ID列表，逗号分隔"),
    logic: str = Query("and", description="注解逻辑，and 或 or"),
    with_metrics: bool = Query(False, description="是否包含监控数据")
):
    """获取主机列表"""
    
    # 构建查询条件
    query = Host.all()
    
    # 关键词搜索
    if key:
        search_condition = Q(name__icontains=key) | Q(primary_ip__icontains=key) | Q(public_ip__icontains=key)
        query = query.filter(search_condition)
    
    # 注解筛选
    if annotation_ids:
        try:
            annotation_id_list = [int(x.strip()) for x in annotation_ids.split(",") if x.strip()]
            if annotation_id_list:
                if logic == "and":
                    for annotation_id in annotation_id_list:
                        query = query.filter(annotations__id=annotation_id)
                else:
                    query = query.filter(annotations__id__in=annotation_id_list).distinct()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid annotation_ids format")
    
    # 计算总数
    total = await query.count()
    
    # 分页查询
    offset = (page - 1) * limit
    if with_metrics:
        hosts = await query.offset(offset).limit(limit).prefetch_related("annotations")
        # 转换为带关联数据的 Schema，并格式化标签
        host_list = []
        for host in hosts:
            host_data = HostSchemaWithRelations.model_validate(host)
            # 格式化注解数据
            formatted_annotations = []
            for annotation in host.annotations:
                formatted_annotations.append({
                    "id": annotation.id,
                    "name": annotation.name,
                    "value": annotation.value,
                    "namespace": annotation.namespace,
                    "key": annotation.key,
                    "createdAt": annotation.created_at.isoformat(),
                    "updatedAt": annotation.updated_at.isoformat(),
                })
            host_data.annotations = formatted_annotations
            host_list.append(host_data)
    else:
        hosts = await query.offset(offset).limit(limit)
        # 转换为基础 Schema
        host_list = [HostSchema.model_validate(host) for host in hosts]
    
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