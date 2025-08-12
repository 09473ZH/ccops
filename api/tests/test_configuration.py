import pytest
import json
from httpx import AsyncClient
from app.main import app
from app.models.configuration import Configuration
from app.models.user import User
from app.utils.auth import AuthUtils


@pytest.fixture
async def test_user():
    """创建测试用户"""
    user = await User.create(
        username="test_config_user",
        email="test@config.com",
        password_hash=AuthUtils.hash_password("testpass"),
        role="admin",
        is_active=True
    )
    yield user
    await user.delete()


@pytest.fixture
async def auth_headers(test_user):
    """获取认证headers"""
    from app.services.auth import AuthService
    
    tokens = await AuthService.generate_tokens(test_user)
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.fixture
async def test_config():
    """创建测试配置"""
    config = await Configuration.create(
        type="test",
        field_name="TestConfig",
        field_value="test_value",
        field_description="测试配置",
        is_changed=False
    )
    yield config
    try:
        await config.delete()
    except:
        pass


class TestConfigurationAPI:
    """配置API测试"""
    
    async def test_get_configurations(self):
        """测试获取配置列表"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/configurations")
            assert response.status_code == 200
            data = response.json()
            assert "data" in data
            assert "list" in data["data"]
            assert "count" in data["data"]
    
    async def test_get_configurations_by_type(self, test_config):
        """测试按类型获取配置"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/configurations?type=test")
            assert response.status_code == 200
            data = response.json()
            assert data["data"]["count"] >= 1
            
            # 检查是否包含我们的测试配置
            configs = data["data"]["list"]
            test_configs = [c for c in configs if c["type"] == "test"]
            assert len(test_configs) >= 1
    
    async def test_get_public_configurations(self):
        """测试获取公开配置"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/configurations/public")
            assert response.status_code == 200
            data = response.json()
            assert "data" in data
            assert isinstance(data["data"], dict)
    
    async def test_get_configuration_by_type_and_name(self, test_config):
        """测试根据类型和名称获取单个配置"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(f"/api/configurations/{test_config.type}/{test_config.field_name}")
            assert response.status_code == 200
            data = response.json()
            assert data["data"]["id"] == test_config.id
            assert data["data"]["type"] == test_config.type
            assert data["data"]["field_name"] == test_config.field_name
    
    async def test_get_nonexistent_configuration(self):
        """测试获取不存在的配置"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/configurations/nonexistent/config")
            assert response.status_code == 404
    
    async def test_create_configuration(self, auth_headers):
        """测试创建配置"""
        config_data = {
            "type": "test_create",
            "field_name": "NewConfig",
            "field_value": "new_value",
            "field_description": "新创建的测试配置",
            "is_changed": False
        }
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/configurations",
                json=config_data,
                headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["data"]["type"] == config_data["type"]
            assert data["data"]["field_name"] == config_data["field_name"]
            assert data["data"]["field_value"] == config_data["field_value"]
            
            # 清理创建的配置
            config_id = data["data"]["id"]
            config = await Configuration.get(id=config_id)
            await config.delete()
    
    async def test_create_duplicate_configuration(self, auth_headers, test_config):
        """测试创建重复配置"""
        config_data = {
            "type": test_config.type,
            "field_name": test_config.field_name,
            "field_value": "duplicate_value",
            "field_description": "重复配置",
            "is_changed": False
        }
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/configurations",
                json=config_data,
                headers=auth_headers
            )
            assert response.status_code == 400
    
    async def test_update_configuration(self, auth_headers, test_config):
        """测试更新配置"""
        update_data = {
            "field_value": "updated_value",
            "field_description": "更新后的描述",
            "is_changed": True
        }
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.put(
                f"/api/configurations/{test_config.type}/{test_config.field_name}",
                json=update_data,
                headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["data"]["field_value"] == update_data["field_value"]
            assert data["data"]["field_description"] == update_data["field_description"]
            assert data["data"]["is_changed"] == update_data["is_changed"]
    
    async def test_update_nonexistent_configuration(self, auth_headers):
        """测试更新不存在的配置"""
        update_data = {
            "field_value": "updated_value"
        }
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.put(
                "/api/configurations/nonexistent/config",
                json=update_data,
                headers=auth_headers
            )
            assert response.status_code == 404
    
    async def test_batch_update_configurations(self, auth_headers, test_config):
        """测试批量更新配置"""
        batch_data = {
            "configurations": [
                {
                    "type": test_config.type,
                    "field_name": test_config.field_name,
                    "field_value": "batch_updated_value"
                }
            ]
        }
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/configurations/batch_update",
                json=batch_data,
                headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["data"]["updated_count"] == 1
            
            # 验证更新结果
            updated_config = await Configuration.get(id=test_config.id)
            assert updated_config.field_value == "batch_updated_value"
            assert updated_config.is_changed == True
    
    async def test_delete_configuration(self, auth_headers):
        """测试删除配置"""
        # 创建一个要删除的配置
        config = await Configuration.create(
            type="test_delete",
            field_name="DeleteConfig",
            field_value="delete_value",
            field_description="要删除的配置",
            is_changed=False
        )
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.delete(
                f"/api/configurations/{config.type}/{config.field_name}",
                headers=auth_headers
            )
            assert response.status_code == 200
            
            # 验证配置已被删除
            from tortoise.exceptions import DoesNotExist
            with pytest.raises(DoesNotExist):
                await Configuration.get(id=config.id)
    
    async def test_delete_nonexistent_configuration(self, auth_headers):
        """测试删除不存在的配置"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.delete(
                "/api/configurations/nonexistent/config",
                headers=auth_headers
            )
            assert response.status_code == 404
    
    async def test_unauthorized_access(self):
        """测试未授权访问"""
        config_data = {
            "type": "test",
            "field_name": "UnauthorizedConfig",
            "field_value": "value",
            "field_description": "未授权配置",
            "is_changed": False
        }
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            # 测试创建配置需要授权
            response = await client.post("/api/configurations", json=config_data)
            assert response.status_code == 401
            
            # 测试更新配置需要授权
            response = await client.put("/api/configurations/test/config", json={"field_value": "new"})
            assert response.status_code == 401
            
            # 测试删除配置需要授权
            response = await client.delete("/api/configurations/test/config")
            assert response.status_code == 401
            
            # 测试批量更新需要授权
            response = await client.post("/api/configurations/batch_update", json={"configurations": []})
            assert response.status_code == 401