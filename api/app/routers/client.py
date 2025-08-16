import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from app.models.host import Host

router = APIRouter(prefix="/client", tags=["client"])

logger = logging.getLogger(__name__)


@router.post("/receive")
async def receive_host_info(host_data: Dict[str, Any]):
    """接收Agent发送的主机信息"""
    try:
        # 提取主机基本信息
        hostname = host_data.get("hostname", "unknown")
        system_info = host_data.get("system_info", {})
        os_info = host_data.get("os_info", {})
        
        # 查找或创建主机记录
        host = await Host.filter(name=hostname).first()
        
        if not host:
            # 创建新主机记录
            host = await Host.create(
                name=hostname,
                operating_system=os_info.get("name", "unknown"),
                status=0,  # 在线状态
                # 系统信息
                cpu_type=system_info.get("cpu_type"),
                cpu_brand=system_info.get("cpu_brand"),
                cpu_logical_cores=system_info.get("cpu_logical_cores"),
                cpu_physical_cores=system_info.get("cpu_physical_cores"),
                physical_memory=system_info.get("physical_memory"),
                computer_name=system_info.get("computer_name"),
                uuid=system_info.get("uuid"),
                # 操作系统信息
                kernel_version=os_info.get("kernel_version"),
                arch=os_info.get("arch"),
                platform=os_info.get("platform"),
                version=os_info.get("version"),
                major=os_info.get("major"),
                minor=os_info.get("minor"),
                patch=os_info.get("patch"),
                build=os_info.get("build"),
            )
            logger.info(f"Created new host: {hostname} (ID: {host.id})")
        else:
            # 更新现有主机信息
            host.status = 0  # 标记为在线
            host.operating_system = os_info.get("name", host.operating_system)
            host.cpu_brand = system_info.get("cpu_brand", host.cpu_brand)
            host.physical_memory = system_info.get("physical_memory", host.physical_memory)
            # 更新其他字段...
            await host.save()
            logger.info(f"Updated host: {hostname} (ID: {host.id})")
        
        return {
            "status": "success",
            "message": "Host information received",
            "host_id": host.id,
            "hostname": hostname
        }
        
    except Exception as e:
        logger.error(f"Failed to process host info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process host info: {str(e)}")


@router.post("/metrics")
async def receive_metrics(metrics_data: Dict[str, Any]):
    """接收Agent发送的系统指标"""
    try:
        # 这里可以处理系统指标数据
        # 目前只是简单记录日志
        logger.info("Received metrics data from agent")
        
        return {
            "status": "success",
            "message": "Metrics received"
        }
        
    except Exception as e:
        logger.error(f"Failed to process metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process metrics: {str(e)}")