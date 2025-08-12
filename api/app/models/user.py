from tortoise.models import Model
from tortoise import fields
from enum import Enum
from datetime import datetime


class UserRole(str, Enum):
    """用户角色枚举"""
    ADMIN = "admin"
    USER = "user"


class User(Model):
    """用户模型"""
    id = fields.IntField(pk=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    
    # 基本信息
    username = fields.CharField(max_length=36, unique=True)
    email = fields.CharField(max_length=128, unique=True, null=True)
    password_hash = fields.CharField(max_length=128)
    
    # 状态字段
    is_active = fields.BooleanField(default=True)  # 是否启用
    is_verified = fields.BooleanField(default=False)  # 邮箱是否验证
    role = fields.CharEnumField(UserRole, default=UserRole.USER)
    
    # 登录信息
    last_login = fields.DatetimeField(null=True)
    login_count = fields.IntField(default=0)
    failed_login_count = fields.IntField(default=0)  # 连续失败次数
    last_failed_login = fields.DatetimeField(null=True)
    
    # 关联关系
    hosts: fields.ManyToManyRelation["Host"] = fields.ManyToManyField(
        "models.Host",
        related_name="users",
        through="user_host_permissions"
    )
    
    class Meta:
        table = "users"
        
    def __str__(self):
        return f"User({self.username})"
        
    async def increment_login_count(self):
        """增加登录次数"""
        self.login_count += 1
        self.last_login = datetime.utcnow()
        self.failed_login_count = 0  # 重置失败次数
        await self.save(update_fields=["login_count", "last_login", "failed_login_count"])
        
    async def increment_failed_login(self):
        """增加失败登录次数"""
        self.failed_login_count += 1
        self.last_failed_login = datetime.utcnow()
        await self.save(update_fields=["failed_login_count", "last_failed_login"])
        
    @property
    def is_locked(self) -> bool:
        """检查账户是否被锁定"""
        if self.failed_login_count >= 5:
            # 检查最后一次失败登录是否在30分钟内
            if self.last_failed_login:
                from datetime import timedelta
                lock_duration = timedelta(minutes=30)
                return datetime.utcnow() - self.last_failed_login < lock_duration
        return False


class LoginLog(Model):
    """登录日志模型"""
    id = fields.IntField(pk=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    
    user = fields.ForeignKeyField("models.User", related_name="login_logs")
    ip_address = fields.CharField(max_length=45)  # 支持 IPv6
    user_agent = fields.TextField(null=True)
    success = fields.BooleanField()
    failure_reason = fields.CharField(max_length=100, null=True)
    
    class Meta:
        table = "login_logs"