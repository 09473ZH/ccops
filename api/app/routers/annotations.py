from fastapi import APIRouter, Query, HTTPException, status, Depends
from typing import List, Optional
from pydantic import BaseModel

from app.schemas.annotation import AnnotationCreate, AnnotationUpdate, AnnotationSchema
from app.schemas.common import ApiResponse
from app.services.annotation import AnnotationService
from app.routers.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/annotations", tags=["注解"])


class AnnotationListResponse(BaseModel):
    """注解列表响应"""
    list: List[dict]
    count: int
    page: int
    limit: int


class AssignAnnotationsRequest(BaseModel):
    """分配注解请求"""
    hostId: int
    annotationIds: List[int]


class UnbindAnnotationsRequest(BaseModel):
    """解绑注解请求"""
    annotationIds: List[int]


@router.get("", response_model=ApiResponse[AnnotationListResponse], summary="获取注解列表")
async def get_annotation_list(
    page: int = Query(1, ge=1, description="页码"),
    limit: int = Query(100, ge=1, le=1000, description="每页数量"),
    current_user: User = Depends(get_current_user)
):
    """
    获取注解列表
    
    支持分页查询，返回注解列表和统计信息
    """
    result = await AnnotationService.get_annotation_list(page=page, limit=limit)
    return ApiResponse(data=result)


@router.post("", response_model=ApiResponse[AnnotationSchema], summary="创建注解")
async def create_annotation(
    request: AnnotationCreate,
    current_user: User = Depends(get_current_user)
):
    """
    创建新注解
    
    支持层级结构：name="server/env", value="prod"
    """
    result = await AnnotationService.create_annotation(request)
    return ApiResponse(data=result)


@router.get("/{annotation_id}", response_model=ApiResponse[AnnotationSchema], summary="获取注解详情")
async def get_annotation(
    annotation_id: int,
    current_user: User = Depends(get_current_user)
):
    """根据ID获取注解详情"""
    result = await AnnotationService.get_annotation_by_id(annotation_id)
    return ApiResponse(data=result)


@router.put("/{annotation_id}", response_model=ApiResponse[AnnotationSchema], summary="更新注解")
async def update_annotation(
    annotation_id: int,
    request: AnnotationUpdate,
    current_user: User = Depends(get_current_user)
):
    """更新注解信息"""
    result = await AnnotationService.update_annotation(annotation_id, request)
    return ApiResponse(data=result)


@router.delete("/{annotation_id}", summary="删除注解")
async def delete_annotation(
    annotation_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    删除注解
    
    注意：只能删除未关联任何主机的注解
    """
    await AnnotationService.delete_annotation(annotation_id)
    return ApiResponse(data={"message": "注解删除成功"})


@router.get("/search", response_model=ApiResponse[List[dict]], summary="搜索注解")
async def search_annotations(
    q: str = Query(..., description="搜索关键词"),
    limit: int = Query(10, ge=1, le=50, description="返回数量限制"),
    current_user: User = Depends(get_current_user)
):
    """搜索注解，支持按名称和值搜索"""
    result = await AnnotationService.search_annotations(q, limit)
    return ApiResponse(data=result)


@router.post("/{annotation_id}/unbind_all_hosts", summary="解除注解的所有主机绑定")
async def unbind_all_hosts_from_annotation(
    annotation_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    解除指定注解与所有主机的绑定关系
    """
    # 查找所有关联此注解的主机
    from app.models.host import Host
    hosts = await Host.filter(annotations__id=annotation_id).all()
    
    # 逐个解除绑定
    for host in hosts:
        await AnnotationService.unbind_annotations_from_host(host.id, [annotation_id])
    
    return ApiResponse(data={"message": f"已解除 {len(hosts)} 台主机的注解绑定"})


# 主机相关的注解操作
@router.post("/assign_to_host", summary="分配注解给主机")
async def assign_annotations_to_host(
    request: AssignAnnotationsRequest,
    current_user: User = Depends(get_current_user)
):
    """
    为主机分配注解
    
    会替换主机的所有现有注解
    """
    await AnnotationService.assign_annotations_to_host(request.hostId, request.annotationIds)
    return ApiResponse(data={"message": "注解分配成功"})


@router.post("/unbind_from_host", summary="解除主机注解绑定")
async def unbind_annotations_from_host(
    request: AssignAnnotationsRequest,
    current_user: User = Depends(get_current_user)
):
    """解除主机的指定注解绑定"""
    await AnnotationService.unbind_annotations_from_host(request.hostId, request.annotationIds)
    return ApiResponse(data={"message": "注解解绑成功"})