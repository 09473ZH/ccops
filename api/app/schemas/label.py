from pydantic import BaseModel, Field
from typing import List
from .common import BaseSchema


class LabelBase(BaseSchema):
    """标签基础Schema"""
    name: str = Field(..., description="标签名称，支持层级结构如 server/env")
    value: str = Field(..., description="标签值")


class LabelCreate(LabelBase):
    """创建标签Schema"""
    pass


class LabelUpdate(BaseModel):
    """更新标签Schema"""
    name: str | None = Field(None, description="标签名称")
    value: str | None = Field(None, description="标签值")


class LabelSchema(LabelBase):
    """标签响应Schema"""
    id: int
    created_at: str
    updated_at: str

    @property
    def namespace(self) -> str | None:
        """获取标签的命名空间部分"""
        if "/" in self.name:
            return self.name.split("/")[0]
        return None
    
    @property
    def key(self) -> str:
        """获取标签的键部分"""
        if "/" in self.name:
            return self.name.split("/")[-1]
        return self.name


class LabelListResponse(BaseModel):
    """标签列表响应Schema"""
    data: List[LabelSchema]
    total: int
    page: int
    limit: int


# 标签选择器 - 类似K8s的matchLabels
class LabelSelector(BaseModel):
    """标签选择器"""
    match_labels: dict[str, str] = Field(default_factory=dict, description="精确匹配的标签")
    match_expressions: List[dict] = Field(default_factory=list, description="表达式匹配")


class LabelMatchExpression(BaseModel):
    """标签匹配表达式"""
    key: str = Field(..., description="标签键")
    operator: str = Field(..., description="操作符: In, NotIn, Exists, DoesNotExist")
    values: List[str] = Field(default_factory=list, description="匹配值列表")