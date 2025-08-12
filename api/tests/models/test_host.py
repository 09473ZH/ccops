import pytest
from datetime import datetime
from tortoise.contrib.test import finalizer, initializer

from app.models.host import Host, HostUser, Disk, Software, Label


@pytest.fixture(scope="module", autouse=True)
async def setup_test_db():
    """设置测试数据库"""
    initializer(
        ["app.models.host"],
        db_url="sqlite://:memory:",
        app_label="models"
    )
    yield
    finalizer()


class TestHostModel:
    """主机模型测试"""
    
    @pytest.mark.asyncio
    async def test_create_host(self):
        """测试创建主机"""
        host = await Host.create(
            name="test-host",
            operating_system="Ubuntu 20.04",
            status=0,
            primary_ip="192.168.1.100"
        )
        
        assert host.id is not None
        assert host.name == "test-host"
        assert host.operating_system == "Ubuntu 20.04"
        assert host.status == 0
        assert host.primary_ip == "192.168.1.100"
        assert isinstance(host.created_at, datetime)
        assert isinstance(host.updated_at, datetime)
    
    @pytest.mark.asyncio
    async def test_host_default_values(self):
        """测试主机默认值"""
        host = await Host.create(name="test-host-defaults")
        
        assert host.status == 0  # 默认在线
        assert host.operating_system is None
        assert host.primary_ip is None
    
    @pytest.mark.asyncio
    async def test_host_string_fields_max_length(self):
        """测试字符串字段长度限制"""
        # 正常长度
        host = await Host.create(name="test-host-normal")
        assert len(host.name) <= 36
        
        # 测试各字段是否有合理的长度限制
        host = await Host.create(
            name="a" * 36,  # 最大长度
            agent="b" * 36,
            host_server_url="c" * 128,
            osquery_host_id="d" * 256
        )
        assert host.name == "a" * 36


class TestHostUserModel:
    """主机用户模型测试"""
    
    @pytest.mark.asyncio
    async def test_create_host_user(self):
        """测试创建主机用户"""
        host = await Host.create(name="test-host")
        
        user = await HostUser.create(
            host_id=host.id,
            username="testuser",
            group_name="testgroup",
            shell="/bin/bash"
        )
        
        assert user.id is not None
        assert user.host_id == host.id
        assert user.username == "testuser"
        assert user.group_name == "testgroup"
        assert user.shell == "/bin/bash"


class TestDiskModel:
    """磁盘模型测试"""
    
    @pytest.mark.asyncio
    async def test_create_disk(self):
        """测试创建磁盘"""
        host = await Host.create(name="test-host")
        
        disk = await Disk.create(
            host_id=host.id,
            disk_space_available=100.5,
            total_disk_space=500.0,
            percent_disk_space_available="20.1%",
            encrypted=True
        )
        
        assert disk.id is not None
        assert disk.host_id == host.id
        assert disk.disk_space_available == 100.5
        assert disk.total_disk_space == 500.0
        assert disk.percent_disk_space_available == "20.1%"
        assert disk.encrypted is True


class TestSoftwareModel:
    """软件模型测试"""
    
    @pytest.mark.asyncio
    async def test_create_software(self):
        """测试创建软件"""
        host = await Host.create(name="test-host")
        
        software = await Software.create(
            host_id=host.id,
            name="nginx",
            version="1.18.0",
            type="web-server"
        )
        
        assert software.id is not None
        assert software.host_id == host.id
        assert software.name == "nginx"
        assert software.version == "1.18.0"
        assert software.type == "web-server"


class TestLabelModel:
    """标签模型测试"""
    
    @pytest.mark.asyncio
    async def test_create_label(self):
        """测试创建标签"""
        label = await Label.create(name="production")
        
        assert label.id is not None
        assert label.name == "production"
        assert isinstance(label.created_at, datetime)
        assert isinstance(label.updated_at, datetime)
    
    @pytest.mark.asyncio
    async def test_label_unique_name(self):
        """测试标签名称唯一性"""
        await Label.create(name="unique-label")
        
        # 尝试创建重复名称的标签应该失败
        with pytest.raises(Exception):  # 具体异常类型可能因数据库而异
            await Label.create(name="unique-label")


class TestHostRelations:
    """主机关联关系测试"""
    
    @pytest.mark.asyncio
    async def test_host_users_relation(self):
        """测试主机与用户的关联"""
        host = await Host.create(name="test-host")
        
        # 创建用户
        await HostUser.create(host_id=host.id, username="user1")
        await HostUser.create(host_id=host.id, username="user2")
        
        # 获取主机用户
        users = await host.get_users()
        assert len(users) == 2
        assert users[0].username in ["user1", "user2"]
        assert users[1].username in ["user1", "user2"]
    
    @pytest.mark.asyncio
    async def test_host_disks_relation(self):
        """测试主机与磁盘的关联"""
        host = await Host.create(name="test-host")
        
        # 创建磁盘
        await Disk.create(host_id=host.id, disk_space_available=100.0, total_disk_space=500.0, percent_disk_space_available="20%")
        await Disk.create(host_id=host.id, disk_space_available=200.0, total_disk_space=1000.0, percent_disk_space_available="20%")
        
        # 获取主机磁盘
        disks = await host.get_disks()
        assert len(disks) == 2
    
    @pytest.mark.asyncio
    async def test_host_software_relation(self):
        """测试主机与软件的关联"""
        host = await Host.create(name="test-host")
        
        # 创建软件
        await Software.create(host_id=host.id, name="nginx", version="1.18.0", type="web-server")
        await Software.create(host_id=host.id, name="mysql", version="8.0", type="database")
        
        # 获取主机软件
        software = await host.get_software()
        assert len(software) == 2
        software_names = [s.name for s in software]
        assert "nginx" in software_names
        assert "mysql" in software_names
    
    @pytest.mark.asyncio
    async def test_host_labels_many_to_many(self):
        """测试主机与标签的多对多关系"""
        host = await Host.create(name="test-host")
        label1 = await Label.create(name="production")
        label2 = await Label.create(name="database")
        
        # 添加标签
        await host.labels.add(label1, label2)
        
        # 获取主机标签
        labels = await host.labels.all()
        assert len(labels) == 2
        label_names = [l.name for l in labels]
        assert "production" in label_names
        assert "database" in label_names