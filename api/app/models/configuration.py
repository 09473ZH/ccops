from tortoise.models import Model
from tortoise import fields


class Configuration(Model):
    """
    系统配置表
    存储系统的各种配置项
    """
    id = fields.IntField(pk=True, description="配置ID")
    type = fields.CharField(max_length=128, description="配置类型分类")
    field_name = fields.CharField(max_length=128, description="配置字段名")
    field_value = fields.TextField(null=True, description="配置字段值")
    field_description = fields.TextField(null=True, description="配置字段描述")
    is_changed = fields.BooleanField(default=False, description="是否已修改")
    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    class Meta:
        table = "configurations"
        table_description = "系统配置表"

    def __str__(self):
        return f"<Configuration {self.type}.{self.field_name}={self.field_value}>"