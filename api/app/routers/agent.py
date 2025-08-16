from fastapi import APIRouter, WebSocket, Depends

from app.services.agent_service import AgentService

router = APIRouter(prefix="/agents", tags=["agent"])


@router.websocket("/connect")
async def agent_websocket_endpoint(
    websocket: WebSocket,
    agent_service: AgentService = Depends(AgentService)
):
    """Agent WebSocket连接端点"""
    await agent_service.handle_agent_websocket(websocket)


@router.get("/status")
async def get_agent_status(agent_service: AgentService = Depends(AgentService)):
    """获取Agent状态信息"""
    return await agent_service.get_agent_status()


@router.get("/hosts")
async def get_online_hosts(agent_service: AgentService = Depends(AgentService)):
    """获取在线主机列表"""
    return await agent_service.get_online_hosts()


@router.get("/hosts/{host_id}/status")
async def get_host_agent_status(
    host_id: int,
    agent_service: AgentService = Depends(AgentService)
):
    """检查指定主机的Agent连接状态"""
    return await agent_service.get_host_agent_status(host_id)


@router.post("/hosts/{host_id}/ssh/start")
async def start_host_ssh_session(
    host_id: int, 
    session_data: dict = None,
    agent_service: AgentService = Depends(AgentService)
):
    """启动指定主机的SSH会话"""
    return await agent_service.start_host_ssh_session(host_id, session_data)


@router.post("/hosts/{host_id}/ssh/stop")
async def stop_host_ssh_session(
    host_id: int, 
    session_data: dict = None,
    agent_service: AgentService = Depends(AgentService)
):
    """停止指定主机的SSH会话"""
    return await agent_service.stop_host_ssh_session(host_id, session_data)