from fastapi import APIRouter, Query
from typing import Optional
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/configurations", tags=["configurations"])


@router.get("", response_model=ApiResponse[dict], summary="获取配置信息")
async def get_configurations(type: Optional[str] = Query(None, description="配置类型")):
    """
    获取系统配置信息
    目前返回空的配置，后续可以扩展
    """
    # 根据type参数返回不同类型的配置
    if type == "system":
        data = {
            "system": {
                "name": "CCOPS",
                "version": "1.0.0",
                "description": "Cloud Computing Operations Platform"
            }
        }
    else:
        data = {}
    
    return ApiResponse(data=data)