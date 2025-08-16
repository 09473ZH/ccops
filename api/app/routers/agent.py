import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import Dict

from app.services.agent_manager import agent_manager

router = APIRouter(prefix="/agents", tags=["agent"])

logger = logging.getLogger(__name__)


@router.websocket("/connect")
async def agent_websocket_endpoint(websocket: WebSocket):
    """Agent WebSocket连接端点"""
    agent_id = None
    
    try:
        # 接受WebSocket连接
        await websocket.accept()
        logger.info("Agent WebSocket connection accepted")
        
        # 等待注册消息
        try:
            data = await websocket.receive_text()
            message = json.loads(data)
        except Exception as e:
            logger.error(f"Failed to receive registration message: {e}")
            await websocket.close(code=1003, reason="Invalid registration message")
            return
        
        # 验证注册消息
        if message.get("type") != "register":
            await websocket.close(code=1003, reason="Expected registration message")
            return
            
        host_id = message.get("host_id")
        if not host_id:
            await websocket.close(code=1003, reason="Missing host_id in registration")
            return
        
        host_info = message.get("data", {})
        
        # 根据hostname查找数据库中的host ID
        from app.models.host import Host
        db_host = await Host.filter(name=host_id).first()
        if db_host:
            # 使用数据库中的ID作为host_id
            actual_host_id = str(db_host.id)
            logger.info(f"Found database host {db_host.id} for hostname {host_id}")
        else:
            # 如果找不到，使用hostname作为host_id
            actual_host_id = host_id
            logger.warning(f"No database host found for hostname {host_id}, using hostname as host_id")
        
        # 注册Agent
        try:
            agent_conn = await agent_manager.register_agent(websocket, actual_host_id, host_info)
            agent_id = f"agent_{actual_host_id}_{id(websocket)}"
            logger.info(f"Agent {agent_id} registered for host {host_id} (DB ID: {actual_host_id})")
            
            # 发送注册确认
            await websocket.send_text(json.dumps({
                "type": "register_ack",
                "agent_id": agent_id,
                "message": "Registration successful"
            }))
            
        except Exception as e:
            logger.error(f"Failed to register agent: {e}")
            await websocket.close(code=1011, reason="Registration failed")
            return
        
        # 消息处理循环
        while True:
            try:
                # 接收来自Agent的消息
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # 处理Agent消息
                await agent_manager.handle_agent_message(agent_id, message)
                
            except WebSocketDisconnect:
                logger.info(f"Agent {agent_id} disconnected")
                break
            except json.JSONDecodeError as e:
                logger.warning(f"Invalid JSON from agent {agent_id}: {e}")
                continue
            except Exception as e:
                logger.error(f"Error handling message from agent {agent_id}: {e}")
                break
                
    except Exception as e:
        logger.error(f"Agent WebSocket error: {e}")
    finally:
        # 清理Agent连接
        if agent_id:
            agent_manager.unregister_agent(agent_id)
            logger.info(f"Agent {agent_id} cleaned up")


@router.get("/status")
async def get_agent_status():
    """获取Agent状态信息"""
    return agent_manager.get_agent_stats()


@router.get("/hosts")
async def get_online_hosts():
    """获取在线主机列表"""
    return {
        "online_hosts": agent_manager.get_online_hosts(),
        "total": len(agent_manager.get_online_hosts())
    }


@router.get("/hosts/{host_id}/status")
async def get_host_agent_status(host_id: int):
    """检查指定主机的Agent连接状态"""
    is_online = agent_manager.is_host_online(str(host_id))
    agent_conn = agent_manager.get_agent_by_host(str(host_id))
    
    if not is_online or not agent_conn:
        raise HTTPException(status_code=404, detail="Host agent not found or offline")
    
    return {
        "host_id": host_id,
        "online": is_online,
        "connected_at": agent_conn.connected_at.isoformat(),
        "last_ping": agent_conn.last_ping.isoformat(),
        "ssh_active": agent_conn.ssh_session_active,
        "user_sessions": len(agent_conn.user_sessions)
    }


@router.post("/hosts/{host_id}/ssh/start")
async def start_host_ssh_session(host_id: int, session_data: dict = None):
    """启动指定主机的SSH会话"""
    if not agent_manager.is_host_online(str(host_id)):
        raise HTTPException(status_code=404, detail="Host agent not found or offline")
    
    session_id = f"ssh_{host_id}_{id(session_data)}"
    
    # 注意：这里需要实际的用户WebSocket连接，这个API主要用于测试
    # 实际的SSH会话启动会在terminal.py路由中处理
    return {
        "message": "SSH session start requested",
        "host_id": host_id,
        "session_id": session_id
    }


@router.post("/hosts/{host_id}/ssh/stop")
async def stop_host_ssh_session(host_id: int, session_data: dict = None):
    """停止指定主机的SSH会话"""
    if not agent_manager.is_host_online(str(host_id)):
        raise HTTPException(status_code=404, detail="Host agent not found or offline")
    
    session_id = session_data.get("session_id") if session_data else f"ssh_{host_id}"
    
    success = await agent_manager.stop_ssh_session(str(host_id), session_id)
    
    return {
        "success": success,
        "host_id": host_id,
        "session_id": session_id
    }


# Agent路由已完成基本功能