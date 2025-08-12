from tortoise.models import Model
from tortoise import fields


class Annotation(Model):
    """
    注解模型 - 用于主机元数据标记和分类
    支持层级结构的注解名称，如 server/env, app/version
    """
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100, description="注解名称，支持层级结构如 server/env")
    value = fields.CharField(max_length=200, description="注解值")
    
    # 时间字段
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    
    class Meta:
        table = "annotations"
        unique_together = [["name", "value"]]  # 确保注解组合唯一
        ordering = ["name", "value"]
    
    def __str__(self):
        return f"{self.name}={self.value}"
    
    @property
    def namespace(self) -> str | None:
        """获取注解的命名空间部分，如 server/env 返回 server"""
        if "/" in self.name:
            return self.name.split("/")[0]
        return None
    
    @property
    def key(self) -> str:
        """获取注解的键部分，如 server/env 返回 env"""
        if "/" in self.name:
            return self.name.split("/")[-1]
        return self.name