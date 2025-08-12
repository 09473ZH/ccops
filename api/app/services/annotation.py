from typing import List
from fastapi import HTTPException, status
from tortoise.expressions import Q

from app.models.annotation import Annotation
from app.models.host import Host
from app.schemas.annotation import AnnotationCreate, AnnotationUpdate, AnnotationSchema


class AnnotationService:
    """注解服务类"""
    
    @staticmethod
    async def get_annotation_list(page: int = 1, limit: int = 100) -> dict:
        """获取注解列表"""
        offset = (page - 1) * limit
        
        # 查询注解
        annotations = await Annotation.all().offset(offset).limit(limit).order_by("name", "value")
        total = await Annotation.all().count()
        
        # 转换为层级注解格式
        annotation_list = []
        for annotation in annotations:
            # 获取关联的主机数量
            host_count = await Host.filter(annotations__id=annotation.id).count()
            
            annotation_data = {
                "id": annotation.id,
                "name": annotation.name,  # server/env
                "value": annotation.value,  # prod
                "namespace": annotation.namespace,  # server
                "key": annotation.key,  # env
                "createdAt": annotation.created_at.isoformat(),
                "updatedAt": annotation.updated_at.isoformat(),
                "hostCount": host_count,
            }
            annotation_list.append(annotation_data)
        
        return {
            "list": annotation_list,
            "count": total,
            "page": page,
            "limit": limit
        }
    
    @staticmethod
    async def create_annotation(create_data: AnnotationCreate) -> AnnotationSchema:
        """创建注解"""
        name = create_data.name
        value = create_data.value
        
        # 检查是否已存在
        existing = await Annotation.filter(name=name, value=value).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"注解 {name}={value} 已存在"
            )
        
        # 创建注解
        annotation = await Annotation.create(name=name, value=value)
        return AnnotationSchema.model_validate(annotation)
    
    @staticmethod
    async def update_annotation(annotation_id: int, update_data: AnnotationUpdate) -> AnnotationSchema:
        """更新注解"""
        annotation = await Annotation.filter(id=annotation_id).first()
        if not annotation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="注解不存在"
            )
        
        # 更新字段
        if update_data.name is not None:
            annotation.name = update_data.name
        
        if update_data.value is not None:
            annotation.value = update_data.value
        
        await annotation.save()
        return AnnotationSchema.model_validate(annotation)
    
    @staticmethod
    async def delete_annotation(annotation_id: int) -> None:
        """删除注解"""
        annotation = await Annotation.filter(id=annotation_id).first()
        if not annotation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="注解不存在"
            )
        
        # 检查是否有主机关联
        host_count = await Host.filter(annotations__id=annotation_id).count()
        if host_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"无法删除注解，还有 {host_count} 台主机关联此注解"
            )
        
        await annotation.delete()
    
    @staticmethod
    async def assign_annotations_to_host(host_id: int, annotation_ids: List[int]) -> None:
        """为主机分配注解"""
        # 检查主机是否存在
        host = await Host.filter(id=host_id).first()
        if not host:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="主机不存在"
            )
        
        # 检查注解是否存在
        annotations = await Annotation.filter(id__in=annotation_ids).all()
        if len(annotations) != len(annotation_ids):
            found_ids = {annotation.id for annotation in annotations}
            missing_ids = set(annotation_ids) - found_ids
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"注解不存在: {list(missing_ids)}"
            )
        
        # 清除现有注解关联
        await host.annotations.clear()
        
        # 添加新的注解关联
        await host.annotations.add(*annotations)
    
    @staticmethod
    async def unbind_annotations_from_host(host_id: int, annotation_ids: List[int]) -> None:
        """解除主机的注解绑定"""
        # 检查主机是否存在
        host = await Host.filter(id=host_id).first()
        if not host:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="主机不存在"
            )
        
        # 检查注解是否存在
        annotations = await Annotation.filter(id__in=annotation_ids).all()
        if annotations:
            await host.annotations.remove(*annotations)
    
    @staticmethod
    async def get_annotation_by_id(annotation_id: int) -> AnnotationSchema:
        """根据ID获取注解"""
        annotation = await Annotation.filter(id=annotation_id).first()
        if not annotation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="注解不存在"
            )
        
        return AnnotationSchema.model_validate(annotation)
    
    @staticmethod
    async def search_annotations(query: str, limit: int = 10) -> List[dict]:
        """搜索注解"""
        annotations = await Annotation.filter(
            Q(name__icontains=query) | Q(value__icontains=query)
        ).limit(limit)
        
        # 返回层级注解格式
        return [
            {
                "id": annotation.id,
                "name": annotation.name,
                "value": annotation.value,
                "namespace": annotation.namespace,
                "key": annotation.key,
            }
            for annotation in annotations
        ]
    
    @staticmethod
    async def get_annotations_by_selector(match_annotations: dict) -> List[AnnotationSchema]:
        """根据注解选择器查询注解（K8s风格）"""
        query = Annotation.all()
        
        for name, value in match_annotations.items():
            query = query.filter(name=name, value=value)
        
        annotations = await query.all()
        return [AnnotationSchema.model_validate(annotation) for annotation in annotations]