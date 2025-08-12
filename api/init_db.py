#!/usr/bin/env python3
"""
数据库初始化脚本
删除所有表，重新创建表结构，并初始化测试数据
"""

import asyncio
from tortoise import Tortoise
from app.core.config import settings
from app.models.user import User
from app.models.host import Host, HostUser, Disk, Software
from app.models.label import Label
from app.utils.auth import AuthUtils


async def init_database():
    """初始化数据库"""
    print("🔄 连接数据库...")
    await Tortoise.init(
        db_url=settings.database_url,
        modules={"models": ["app.models.host", "app.models.user", "app.models.label"]}
    )
    
    print("🗑️  手动删除所有表...")
    # 手动删除所有表（包括外键约束）
    connection = Tortoise.get_connection("default")
    
    # 删除表的顺序很重要（先删除有外键的表）
    tables_to_drop = [
        "host_labels",  # 多对多关系表
        "host_users", "disks", "software",  # 主机相关表
        "labels", "users", "hosts"  # 主表
    ]
    
    for table in tables_to_drop:
        try:
            await connection.execute_query(f"DROP TABLE IF EXISTS {table} CASCADE")
            print(f"   删除表: {table}")
        except Exception as e:
            print(f"   警告: 删除表 {table} 失败: {e}")
    
    print("📋 重新创建表结构...")
    # 重新创建表
    await Tortoise.generate_schemas()
    
    print("👤 创建管理员用户...")
    # 创建管理员用户
    admin_user = await User.create(
        username="admin",
        email="admin@ccops.local",
        password_hash=AuthUtils.hash_password("admin"),
        role="admin",
        is_active=True
    )
    print(f"✅ 创建管理员用户成功: {admin_user.username}")
    
    print("🏷️  创建测试标签...")
    # 创建一些测试标签
    labels = [
        await Label.create(name="server/env", value="production"),
        await Label.create(name="server/env", value="staging"),
        await Label.create(name="server/os", value="ubuntu"),
        await Label.create(name="server/type", value="web"),
        await Label.create(name="app/version", value="v1.2.3"),
        await Label.create(name="team/owner", value="backend"),
    ]
    print(f"✅ 创建 {len(labels)} 个测试标签")
    
    print("🖥️  创建测试主机...")
    # 创建测试主机
    host = await Host.create(
        name="web-server-01",
        operating_system="Ubuntu 22.04.3 LTS",
        status=0,  # 在线
        agent="osquery-5.10.2",
        osquery_version="5.10.2",
        platform_like="debian",
        cpu_type="x86_64",
        cpu_brand="Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz",
        cpu_logical_cores="4",
        cpu_physical_cores="2",
        physical_memory="8589934592",  # 8GB
        primary_ip="192.168.1.100",
        primary_mac="02:42:ac:11:00:02",
        public_ip="203.0.113.100",
        country="China",
        city="Shanghai"
    )
    
    # 关联标签
    await host.labels.add(labels[0])  # server/env=production
    await host.labels.add(labels[2])  # server/os=ubuntu
    await host.labels.add(labels[3])  # server/type=web
    await host.labels.add(labels[4])  # app/version=v1.2.3
    await host.labels.add(labels[5])  # team/owner=backend
    
    print(f"✅ 创建测试主机成功: {host.name}")
    
    print("👥 创建主机用户...")
    # 创建主机用户
    users = [
        await HostUser.create(
            host_id=host.id,
            username="root",
            group_name="root",
            shell="/bin/bash"
        ),
        await HostUser.create(
            host_id=host.id,
            username="ubuntu",
            group_name="ubuntu",
            shell="/bin/bash"
        ),
        await HostUser.create(
            host_id=host.id,
            username="nginx",
            group_name="nginx",
            shell="/usr/sbin/nologin"
        )
    ]
    print(f"✅ 创建 {len(users)} 个主机用户")
    
    print("💾 创建磁盘信息...")
    # 创建磁盘信息
    disk = await Disk.create(
        host_id=host.id,
        disk_space_available=50.5,  # GB
        total_disk_space=100.0,     # GB
        percent_disk_space_available="50.5%",
        encrypted=False
    )
    print(f"✅ 创建磁盘信息: {disk.total_disk_space}GB 总容量")
    
    print("📦 创建软件信息...")
    # 创建软件信息
    software_list = [
        await Software.create(
            host_id=host.id,
            name="nginx",
            version="1.18.0",
            type="web_server"
        ),
        await Software.create(
            host_id=host.id,
            name="python3",
            version="3.10.12",
            type="runtime"
        ),
        await Software.create(
            host_id=host.id,
            name="docker",
            version="24.0.7",
            type="container"
        )
    ]
    print(f"✅ 创建 {len(software_list)} 个软件记录")
    
    print("🎉 数据库初始化完成！")
    print("\n📊 初始化数据统计:")
    print(f"   👤 用户: {await User.all().count()} 个")
    print(f"   🖥️  主机: {await Host.all().count()} 台")
    print(f"   🏷️  标签: {await Label.all().count()} 个")
    print(f"   👥 主机用户: {await HostUser.all().count()} 个")
    print(f"   💾 磁盘: {await Disk.all().count()} 个")
    print(f"   📦 软件: {await Software.all().count()} 个")
    
    print(f"\n🔑 登录信息:")
    print(f"   用户名: admin")
    print(f"   密码: admin")
    
    await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(init_database())