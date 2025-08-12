import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.main import app


class TestMainApplication:
    """主应用测试"""
    
    def test_app_instance(self):
        """测试应用实例"""
        assert isinstance(app, FastAPI)
    
    def test_app_title(self):
        """测试应用标题"""
        assert app.title == "CCOPS API"
    
    def test_app_has_middleware(self):
        """测试应用中间件"""
        # 检查是否有中间件
        assert len(app.user_middleware) > 0
        
        # 检查CORS中间件
        middleware_classes = [middleware.cls.__name__ for middleware in app.user_middleware]
        assert "CORSMiddleware" in middleware_classes
    
    def test_app_has_routes(self):
        """测试应用路由"""
        # 检查路由数量
        assert len(app.routes) > 0
        
        # 检查基础路由
        route_paths = [route.path for route in app.routes]
        assert "/" in route_paths
        assert "/health" in route_paths
        
        # 检查API路由是否被包含
        api_routes = [route for route in app.routes if hasattr(route, 'path_regex')]
        assert len(api_routes) > 2


class TestMainEndpoints:
    """主应用端点测试"""
    
    @pytest.fixture
    def client(self):
        """创建测试客户端"""
        return TestClient(app)
    
    def test_root_endpoint(self, client):
        """测试根端点"""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"message": "Hello from CCOPS API!"}
    
    def test_health_endpoint(self, client):
        """测试健康检查端点"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}
    
    def test_docs_endpoint(self, client):
        """测试API文档端点"""
        response = client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
    
    def test_openapi_endpoint(self, client):
        """测试OpenAPI规范端点"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"
        
        openapi_spec = response.json()
        assert "openapi" in openapi_spec
        assert "info" in openapi_spec
        assert "paths" in openapi_spec
        assert openapi_spec["info"]["title"] == "CCOPS API"


class TestMainConfiguration:
    """主应用配置测试"""
    
    def test_cors_configuration(self):
        """测试CORS配置"""
        # 检查CORS中间件存在
        cors_middleware = None
        for middleware in app.user_middleware:
            if middleware.cls.__name__ == "CORSMiddleware":
                cors_middleware = middleware
                break
        
        assert cors_middleware is not None
        
        # 检查CORS配置选项
        cors_options = cors_middleware.kwargs
        assert cors_options["allow_origins"] == ["*"]
        assert cors_options["allow_credentials"] is True
        assert cors_options["allow_methods"] == ["*"]
        assert cors_options["allow_headers"] == ["*"]
    
    def test_lifespan_configuration(self):
        """测试生命周期配置"""
        # 检查应用是否配置了lifespan
        assert app.router.lifespan_context is not None
    
    def test_router_inclusion(self):
        """测试路由包含"""
        # 检查主机路由是否被包含
        from app.routers import hosts_router
        
        # 检查路由是否在应用中
        included_routers = []
        for route in app.routes:
            if hasattr(route, 'app') and hasattr(route.app, 'routes'):
                included_routers.extend(route.app.routes)
        
        # 应该有来自hosts路由的路径
        all_paths = [route.path for route in app.routes]
        # 主机相关的路由应该存在（通过prefix添加）
        assert any("/api/v1" in path for path in all_paths)


class TestMainImports:
    """主应用导入测试"""
    
    def test_main_imports(self):
        """测试main.py的导入"""
        from app.main import app
        from app.core.config import settings
        from app.core.database import init_db, close_db
        
        assert app is not None
        assert settings is not None
        assert init_db is not None
        assert close_db is not None
    
    def test_router_imports(self):
        """测试路由导入"""
        from app.routers import hosts_router
        assert hosts_router is not None