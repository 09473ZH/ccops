import asyncio
import logging
from fastapi import WebSocket

from app.models.host import Host
from app.services.agent_manager import agent_manager

logger = logging.getLogger(__name__)


class AgentTerminal:
    """通过Agent连接的SSH终端"""
    def __init__(self, host: Host, websocket: WebSocket, session_id: str):
        self.host = host
        self.websocket = websocket
        self.session_id = session_id
        self.connected = False

    async def connect_agent_ssh(self):
        """通过Agent建立SSH连接"""
        try:
            # 检查Agent是否在线
            if not agent_manager.is_host_online(str(self.host.id)):
                await self.websocket.send_text("错误: Agent未连接或主机离线")
                return False

            # 启动SSH会话
            success = await agent_manager.start_ssh_session(
                str(self.host.id), 
                self.session_id, 
                self.websocket
            )
            
            if success:
                self.connected = True
                logger.info(f"Agent SSH连接建立成功: host={self.host.id}, session={self.session_id}")
                return True
            else:
                await self.websocket.send_text("错误: 无法启动Agent SSH会话")
                return False
                
        except Exception as e:
            logger.error(f"Agent SSH连接失败: {str(e)}")
            await self.websocket.send_text(f"Agent SSH连接失败: {str(e)}")
            return False

    async def send_input(self, data: bytes):
        """发送输入到Agent SSH"""
        try:
            if not self.connected:
                logger.warning("Agent SSH未连接，忽略输入")
                return

            success = await agent_manager.send_ssh_data(
                str(self.host.id), 
                self.session_id, 
                data
            )
            
            if not success:
                logger.error("发送数据到Agent失败")
                
        except Exception as e:
            logger.error(f"发送输入到Agent失败: {e}")
            await self.websocket.send_text(f"输入发送错误: {str(e)}")

    async def resize_terminal(self, rows: int, cols: int):
        """调整Agent终端大小"""
        try:
            if not self.connected:
                return

            success = await agent_manager.resize_ssh_terminal(
                str(self.host.id), 
                self.session_id, 
                cols, 
                rows
            )
            
            if not success:
                logger.warning("调整Agent终端大小失败")
                
        except Exception as e:
            logger.warning(f"调整Agent终端大小失败: {e}")

    def close(self):
        """关闭Agent SSH连接"""
        try:
            if self.connected:
                # 异步停止SSH会话（不等待结果）
                asyncio.create_task(agent_manager.stop_ssh_session(
                    str(self.host.id), 
                    self.session_id
                ))
                self.connected = False
                logger.info(f"Agent SSH连接关闭: host={self.host.id}, session={self.session_id}")
        except Exception as e:
            logger.error(f"关闭Agent SSH连接失败: {e}")