import asyncio
import json
import logging
from typing import Dict, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

logger = logging.getLogger(__name__)


class AgentConnection:
    def __init__(self, websocket: WebSocket, host_id: str):
        self.websocket = websocket
        self.host_id = host_id
        self.connected_at = datetime.now()
        self.last_ping = datetime.now()
        self.ssh_session_active = False
        self.user_sessions: Dict[str, WebSocket] = {}  # 用户会话映射
        
    def add_user_session(self, session_id: str, user_websocket: WebSocket):
        """添加用户会话"""
        self.user_sessions[session_id] = user_websocket
        
    def remove_user_session(self, session_id: str):
        """移除用户会话"""
        if session_id in self.user_sessions:
            del self.user_sessions[session_id]
            
    async def send_to_agent(self, message: dict):
        """向Agent发送消息"""
        try:
            await self.websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to send message to agent {self.host_id}: {e}")
            raise
            
    async def send_to_users(self, data: bytes):
        """向所有用户会话发送数据"""
        if not self.user_sessions:
            return
            
        # 将bytes转换为文本发送给前端
        try:
            text_data = data.decode('utf-8', errors='replace')
        except Exception as e:
            logger.error(f"Failed to decode data: {e}")
            return
            
        disconnected_sessions = []
        for session_id, user_ws in self.user_sessions.items():
            try:
                await user_ws.send_text(text_data)  # 发送文本而不是二进制
            except Exception as e:
                logger.warning(f"Failed to send to user session {session_id}: {e}")
                disconnected_sessions.append(session_id)
                
        # 清理断开的会话
        for session_id in disconnected_sessions:
            self.remove_user_session(session_id)
            
    async def send_to_user_session(self, session_id: str, data: bytes):
        """向特定用户会话发送数据"""
        if session_id not in self.user_sessions:
            logger.warning(f"User session {session_id} not found")
            return
            
        # 将bytes转换为文本发送给前端
        try:
            text_data = data.decode('utf-8', errors='replace')
        except Exception as e:
            logger.error(f"Failed to decode data: {e}")
            return
            
        try:
            await self.user_sessions[session_id].send_text(text_data)
            
            # 检测会话结束消息，主动关闭WebSocket连接
            if "[Session ended]" in text_data:
                logger.info(f"Session {session_id} ended normally, closing WebSocket")
                await self.user_sessions[session_id].close()
                self.remove_user_session(session_id)
                
        except Exception as e:
            logger.warning(f"Failed to send to user session {session_id}: {e}")
            self.remove_user_session(session_id)


class AgentManager:
    def __init__(self):
        self.agents: Dict[str, AgentConnection] = {}
        self.host_to_agent: Dict[str, str] = {}  # host_id -> agent_id 映射
        
    async def register_agent(self, websocket: WebSocket, host_id: str, host_info: dict = None) -> AgentConnection:
        """注册新的Agent连接"""
        agent_id = f"agent_{host_id}_{id(websocket)}"
        
        agent_conn = AgentConnection(websocket, host_id)
        self.agents[agent_id] = agent_conn
        self.host_to_agent[host_id] = agent_id
        
        logger.info(f"Agent registered: {agent_id} for host {host_id}")
        logger.info(f"Current host_to_agent mapping: {self.host_to_agent}")
        if host_info:
            logger.info(f"Host info: {host_info.get('HostName', 'Unknown')} - {host_info.get('AgentVersion', 'Unknown Version')}")
            
        return agent_conn
        
    def unregister_agent(self, agent_id: str):
        """注销Agent连接"""
        if agent_id in self.agents:
            agent_conn = self.agents[agent_id]
            host_id = agent_conn.host_id
            
            # 清理映射
            if host_id in self.host_to_agent and self.host_to_agent[host_id] == agent_id:
                del self.host_to_agent[host_id]
                
            del self.agents[agent_id]
            logger.info(f"Agent unregistered: {agent_id} for host {host_id}")
            
    def get_agent_by_host(self, host_id: str) -> Optional[AgentConnection]:
        """根据主机ID获取Agent连接"""
        agent_id = self.host_to_agent.get(str(host_id))
        if agent_id and agent_id in self.agents:
            return self.agents[agent_id]
        return None
        
    def get_agent_by_id(self, agent_id: str) -> Optional[AgentConnection]:
        """根据Agent ID获取Agent连接"""
        return self.agents.get(agent_id)
        
    def is_host_online(self, host_id: str) -> bool:
        """检查主机是否在线（通过Agent连接）"""
        return str(host_id) in self.host_to_agent
        
    def get_online_hosts(self) -> list:
        """获取所有在线主机列表"""
        return list(self.host_to_agent.keys())
        
    async def start_ssh_session(self, host_id: str, session_id: str, user_websocket: WebSocket) -> bool:
        """为指定主机启动SSH会话"""
        agent_conn = self.get_agent_by_host(host_id)
        if not agent_conn:
            logger.warning(f"No agent found for host {host_id}")
            return False
            
        try:
            logger.info(f"Sending ssh_start message to agent for host {host_id}")
            # 向Agent发送SSH启动请求
            await agent_conn.send_to_agent({
                "type": "ssh_start",
                "session_id": session_id
            })
            
            # 添加用户会话映射
            agent_conn.add_user_session(session_id, user_websocket)
            agent_conn.ssh_session_active = True
            
            logger.info(f"SSH session started for host {host_id}, session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start SSH session for host {host_id}: {e}")
            return False
            
    async def stop_ssh_session(self, host_id: str, session_id: str) -> bool:
        """停止SSH会话"""
        agent_conn = self.get_agent_by_host(host_id)
        if not agent_conn:
            return False
            
        try:
            # 向Agent发送SSH停止请求
            await agent_conn.send_to_agent({
                "type": "ssh_stop",
                "session_id": session_id
            })
            
            # 移除用户会话映射
            agent_conn.remove_user_session(session_id)
            
            # 如果没有用户会话了，标记SSH为非活跃状态
            if not agent_conn.user_sessions:
                agent_conn.ssh_session_active = False
                
            logger.info(f"SSH session stopped for host {host_id}, session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to stop SSH session for host {host_id}: {e}")
            return False
            
    async def send_ssh_data(self, host_id: str, session_id: str, data: bytes) -> bool:
        """向指定主机的SSH会话发送数据"""
        agent_conn = self.get_agent_by_host(host_id)
        if not agent_conn:
            return False
            
        try:
            # 确保data是bytes类型
            if isinstance(data, str):
                data = data.encode('utf-8')
            elif not isinstance(data, bytes):
                data = str(data).encode('utf-8')
                
            await agent_conn.send_to_agent({
                "type": "ssh_data",
                "session_id": session_id,
                "data": {
                    "data": list(data),  # 将bytes转换为list以便JSON序列化
                    "binary": True
                }
            })
            return True
            
        except Exception as e:
            logger.error(f"Failed to send SSH data to host {host_id}: {e}")
            return False
            
    async def resize_ssh_terminal(self, host_id: str, session_id: str, width: int, height: int) -> bool:
        """调整SSH终端大小"""
        agent_conn = self.get_agent_by_host(host_id)
        if not agent_conn:
            return False
            
        try:
            await agent_conn.send_to_agent({
                "type": "ssh_resize",
                "session_id": session_id,
                "data": {
                    "width": width,
                    "height": height
                }
            })
            return True
            
        except Exception as e:
            logger.error(f"Failed to resize SSH terminal for host {host_id}: {e}")
            return False
            
    async def handle_agent_message(self, agent_id: str, message: dict):
        """处理来自Agent的消息"""
        agent_conn = self.get_agent_by_id(agent_id)
        if not agent_conn:
            logger.warning(f"Received message from unknown agent: {agent_id}")
            return
            
        msg_type = message.get("type")
        # 处理来自Agent的消息
        
        if msg_type == "ssh_output":
            # SSH输出数据，转发给用户会话
            session_id = message.get("session_id")
            if not session_id:
                logger.warning(f"ssh_output message missing session_id from agent {agent_id}")
                return
                
            data = message.get("data", {})
            if data.get("binary") and "data" in data:
                try:
                    # 处理Go发送的base64编码数据
                    data_content = data["data"]
                    if isinstance(data_content, str):
                        # Go的[]byte被JSON序列化为base64字符串
                        import base64
                        output_bytes = base64.b64decode(data_content)
                    elif isinstance(data_content, list):
                        # 整数数组格式
                        output_bytes = bytes([min(255, max(0, int(x))) for x in data_content])
                    elif isinstance(data_content, bytes):
                        output_bytes = data_content
                    else:
                        logger.error(f"Unknown data type in ssh_output: {type(data_content)}")
                        return
                        
                    # 数据解码成功，发送到用户会话
                    await agent_conn.send_to_user_session(session_id, output_bytes)
                except Exception as e:
                    logger.error(f"Failed to process ssh_output data: {e}")
                    logger.error(f"Data type: {type(data.get('data'))}, Data: {data.get('data')[:10] if isinstance(data.get('data'), list) else data.get('data')}")
                    return
                
        elif msg_type == "ssh_ready":
            logger.info(f"SSH ready for agent {agent_id}")
            
        elif msg_type == "ssh_error":
            session_id = message.get("session_id")
            error_msg = message.get("error", "Unknown SSH error")
            logger.error(f"SSH error from agent {agent_id} session {session_id}: {error_msg}")
            # 向特定用户会话发送错误信息
            error_bytes = f"SSH Error: {error_msg}\r\n".encode('utf-8')
            if session_id:
                await agent_conn.send_to_user_session(session_id, error_bytes)
            else:
                await agent_conn.send_to_users(error_bytes)
            
        elif msg_type == "pong":
            # 心跳响应（暂时忽略）
            pass
            
        else:
            logger.warning(f"Unknown message type from agent {agent_id}: {msg_type}")
            
    def get_agent_stats(self) -> dict:
        """获取Agent统计信息"""
        return {
            "total_agents": len(self.agents),
            "online_hosts": len(self.host_to_agent),
            "agents": [
                {
                    "agent_id": agent_id,
                    "host_id": conn.host_id,
                    "connected_at": conn.connected_at.isoformat(),
                    "ssh_active": conn.ssh_session_active,
                    "user_sessions": len(conn.user_sessions)
                }
                for agent_id, conn in self.agents.items()
            ]
        }


# 全局Agent管理器实例
agent_manager = AgentManager()