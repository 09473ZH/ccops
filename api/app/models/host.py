from tortoise.models import Model
from tortoise import fields
from datetime import datetime
from typing import List, Optional


class HostUser(Model):
    id = fields.IntField(pk=True)
    host_id = fields.IntField(index=True)
    username = fields.CharField(max_length=255)
    group_name = fields.CharField(max_length=255, null=True)
    shell = fields.CharField(max_length=255, null=True)
    
    class Meta:
        table = "host_users"


class Disk(Model):
    id = fields.IntField(pk=True)
    host_id = fields.IntField(index=True)
    disk_space_available = fields.FloatField()
    total_disk_space = fields.FloatField()
    percent_disk_space_available = fields.CharField(max_length=20)
    encrypted = fields.BooleanField(default=False)
    
    class Meta:
        table = "disks"


class Software(Model):
    id = fields.IntField(pk=True)
    host_id = fields.IntField(index=True)
    name = fields.CharField(max_length=255)
    version = fields.CharField(max_length=255)
    type = fields.CharField(max_length=100)
    
    class Meta:
        table = "software"




class Host(Model):
    id = fields.IntField(pk=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    
    # 基本信息
    name = fields.CharField(max_length=36)
    operating_system = fields.CharField(max_length=36, null=True)
    status = fields.IntField(default=0)  # 0:在线 1:下线
    
    # 时间信息
    fetch_time = fields.DatetimeField(null=True)
    start_time = fields.DatetimeField(null=True)
    
    # 连接信息
    agent = fields.CharField(max_length=36, null=True)
    host_server_url = fields.CharField(max_length=128, null=True)
    
    # 系统信息
    osquery_host_id = fields.CharField(max_length=256, null=True)
    osquery_version = fields.CharField(max_length=64, null=True)
    platform_like = fields.CharField(max_length=64, null=True)
    
    # 硬件信息
    cpu_type = fields.CharField(max_length=64, null=True)
    cpu_brand = fields.CharField(max_length=64, null=True)
    cpu_logical_cores = fields.CharField(max_length=64, null=True)
    cpu_physical_cores = fields.CharField(max_length=64, null=True)
    physical_memory = fields.CharField(max_length=64, null=True)
    
    # 网络信息
    primary_ip = fields.CharField(max_length=64, null=True)
    primary_mac = fields.CharField(max_length=64, null=True)
    public_ip = fields.CharField(max_length=64, null=True)
    country = fields.CharField(max_length=64, null=True)
    city = fields.CharField(max_length=64, null=True)
    
    # 关联关系
    labels: fields.ManyToManyRelation["Label"] = fields.ManyToManyField(
        "models.Label",
        related_name="hosts",
        through="host_labels"
    )
    
    class Meta:
        table = "hosts"
        
    async def get_users(self) -> List[HostUser]:
        """获取主机用户列表"""
        return await HostUser.filter(host_id=self.id)
    
    async def get_disks(self) -> List[Disk]:
        """获取主机磁盘列表"""
        return await Disk.filter(host_id=self.id)
    
    async def get_software(self) -> List[Software]:
        """获取主机软件列表"""
        return await Software.filter(host_id=self.id)