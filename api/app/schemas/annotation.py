from pydantic import BaseModel, Field
from typing import List
from .host import BaseSchema


class AnnotationBase(BaseSchema):
    """注解基础Schema"""
    name: str = Field(..., description="注解名称，支持层级结构如 server/env")
    value: str = Field(..., description="注解值")


class AnnotationCreate(AnnotationBase):
    """创建注解Schema"""
    pass


class AnnotationUpdate(BaseModel):
    """更新注解Schema"""
    name: str | None = Field(None, description="注解名称")
    value: str | None = Field(None, description="注解值")


class AnnotationSchema(AnnotationBase):
    """注解响应Schema"""
    id: int
    created_at: str
    updated_at: str

    @property
    def namespace(self) -> str | None:
        """获取注解的命名空间部分"""
        if "/" in self.name:
            return self.name.split("/")[0]
        return None
    
    @property
    def key(self) -> str:
        """获取注解的键部分"""
        if "/" in self.name:
            return self.name.split("/")[-1]
        return self.name


class AnnotationListResponse(BaseModel):
    """注解列表响应Schema"""
    data: List[AnnotationSchema]
    total: int
    page: int
    limit: int


# 注解选择器 - 类似K8s的matchLabels
class AnnotationSelector(BaseModel):
    """注解选择器"""
    match_annotations: dict[str, str] = Field(default_factory=dict, description="精确匹配的注解")
    match_expressions: List[dict] = Field(default_factory=list, description="表达式匹配")


class AnnotationMatchExpression(BaseModel):
    """注解匹配表达式"""
    key: str = Field(..., description="注解键")
    operator: str = Field(..., description="操作符: In, NotIn, Exists, DoesNotExist")
    values: List[str] = Field(default_factory=list, description="匹配值列表")