import pytest
from datetime import datetime
from typing import List

from app.schemas.host import (
    HostSchema, 
    HostSchemaWithRelations, 
    HostListRequest, 
    HostListResponse,
    AnnotationSchemaForHost,
    HostUserSchema,
    DiskSchema,
    SoftwareSchema
)


class TestHostSchemas:
    """主机Schema测试"""
    
    def test_host_list_request_defaults(self):
        """测试主机列表请求默认值"""
        request = HostListRequest()
        
        assert request.page == 1
        assert request.limit == 20
        assert request.key is None
        assert request.annotation_ids is None
        assert request.logic == "and"
        assert request.with_metrics is False
    
    def test_host_list_request_custom_values(self):
        """测试主机列表请求自定义值"""
        request = HostListRequest(
            page=2,
            limit=50,
            key="test",
            annotation_ids=[1, 2, 3],
            logic="or",
            with_metrics=True
        )
        
        assert request.page == 2
        assert request.limit == 50
        assert request.key == "test"
        assert request.annotation_ids == [1, 2, 3]
        assert request.logic == "or"
        assert request.with_metrics is True
    
    def test_host_list_response_structure(self):
        """测试主机列表响应结构"""
        response = HostListResponse(
            data=[],
            total=0,
            page=1,
            limit=20
        )
        
        assert isinstance(response.data, list)
        assert response.total == 0
        assert response.page == 1
        assert response.limit == 20
    
    def test_host_list_response_with_data(self):
        """测试带数据的主机列表响应"""
        # 注意：这里我们不能直接创建HostSchema实例
        # 因为它是通过pydantic_model_creator生成的
        # 我们只测试响应结构
        
        response = HostListResponse(
            data=[],  # 在实际使用中会包含HostSchema实例
            total=5,
            page=1,
            limit=10
        )
        
        assert response.total == 5
        assert len(response.data) == 0  # 空列表用于测试


class TestSchemaValidation:
    """Schema验证测试"""
    
    def test_host_list_request_validation_page(self):
        """测试页码验证"""
        # 正常页码
        request = HostListRequest(page=1)
        assert request.page == 1
        
        request = HostListRequest(page=100)
        assert request.page == 100
    
    def test_host_list_request_validation_limit(self):
        """测试限制数验证"""
        # 正常限制数
        request = HostListRequest(limit=10)
        assert request.limit == 10
        
        request = HostListRequest(limit=100)
        assert request.limit == 100
    
    def test_host_list_request_validation_logic(self):
        """测试逻辑参数验证"""
        # and逻辑
        request = HostListRequest(logic="and")
        assert request.logic == "and"
        
        # or逻辑
        request = HostListRequest(logic="or")
        assert request.logic == "or"
    
    def test_host_list_request_annotation_ids_type(self):
        """测试标签ID列表类型"""
        # 空列表
        request = HostListRequest(annotation_ids=[])
        assert request.annotation_ids == []
        
        # 整数列表
        request = HostListRequest(annotation_ids=[1, 2, 3])
        assert request.annotation_ids == [1, 2, 3]
        
        # None值
        request = HostListRequest(annotation_ids=None)
        assert request.annotation_ids is None


class TestSchemaImports:
    """Schema导入测试"""
    
    def test_all_schemas_importable(self):
        """测试所有Schema都能正确导入"""
        # 这些应该都能导入而不出错
        assert HostSchema is not None
        assert HostSchemaWithRelations is not None
        assert HostListRequest is not None
        assert HostListResponse is not None
        assert AnnotationSchemaForHost is not None
        assert HostUserSchema is not None
        assert DiskSchema is not None
        assert SoftwareSchema is not None
    
    def test_schemas_are_pydantic_models(self):
        """测试Schema是否为Pydantic模型"""
        from pydantic import BaseModel
        
        # 检查手动定义的模型
        assert issubclass(HostListRequest, BaseModel)
        assert issubclass(HostListResponse, BaseModel)
        
        # 注意：pydantic_model_creator生成的模型也是BaseModel的子类
        # 但在这里我们无法直接检查，因为需要数据库连接


class TestSchemaJsonSerialization:
    """Schema JSON序列化测试"""
    
    def test_host_list_request_json(self):
        """测试主机列表请求JSON序列化"""
        request = HostListRequest(
            page=1,
            limit=20,
            key="test",
            logic="and"
        )
        
        json_data = request.model_dump()
        
        assert json_data["page"] == 1
        assert json_data["limit"] == 20
        assert json_data["key"] == "test"
        assert json_data["logic"] == "and"
        assert json_data["with_metrics"] is False
    
    def test_host_list_response_json(self):
        """测试主机列表响应JSON序列化"""
        response = HostListResponse(
            data=[],
            total=10,
            page=1,
            limit=20
        )
        
        json_data = response.model_dump()
        
        assert json_data["data"] == []
        assert json_data["total"] == 10
        assert json_data["page"] == 1
        assert json_data["limit"] == 20