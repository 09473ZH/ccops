import asyncio
import logging
from fastapi import WebSocket, WebSocketDisconnect, Depends

from app.models.host import Host
from app.services.agent_manager import agent_manager
from app.managers.connection_manager import manager
from app.services.terminals.agent_terminal import AgentTerminal
from app.services.terminals.ssh_terminal import SSHTerminal

logger = logging.getLogger(__name__)


class TerminalService:
    """终端服务，处理WebSocket连接和终端会话管理"""
    
    def __init__(self):
        self.logger = logger
    
    async def handle_terminal_websocket(self, websocket: WebSocket, host_id: int):
        """处理终端WebSocket连接的主要逻辑"""
        session_id = f"{host_id}_{id(websocket)}"
        terminal = None
        output_task = None
        stderr_task = None
        
        try:
            # 连接WebSocket
            await manager.connect(session_id, websocket)
            
            # 验证用户权限 (暂时注释，和Go版本保持一致)
            # 可以通过查询参数或header传递token进行验证
            
            # 获取主机信息
            host = await Host.get_or_none(id=host_id)
            if not host:
                await websocket.send_text("主机不存在")
                await websocket.close()
                return
            
            # 建立终端连接
            terminal = await self._create_terminal_connection(host, websocket, session_id, host_id)
            if not terminal:
                await websocket.close()
                return
            
            # 如果是SSH直连，启动输出处理任务
            if isinstance(terminal, SSHTerminal):
                output_task = asyncio.create_task(terminal.handle_ssh_output())
                stderr_task = asyncio.create_task(terminal.handle_ssh_stderr())
            
            # 处理WebSocket消息循环
            await self._handle_websocket_messages(websocket, terminal)
            
        except WebSocketDisconnect:
            logger.info(f"WebSocket连接断开: {session_id}")
        except Exception as e:
            logger.error(f"WebSocket连接失败: {e}")
        finally:
            # 清理资源
            await self._cleanup_resources(terminal, output_task, stderr_task, session_id)
    
    async def _create_terminal_connection(self, host: Host, websocket: WebSocket, session_id: str, host_id: int):
        """创建终端连接（Agent或SSH直连）"""
        # 检查连接类型：优先使用Agent连接，如果Agent不在线则尝试直连
        use_agent = agent_manager.is_host_online(str(host_id))
        logger.info(f"Host {host_id} agent online status: {use_agent}")
        logger.info(f"Available agents: {agent_manager.get_online_hosts()}")
        
        if use_agent:
            # 使用Agent连接
            logger.info(f"使用Agent连接主机 {host_id}")
            terminal = AgentTerminal(host, websocket, session_id)
            
            # 建立Agent SSH连接
            logger.info(f"Attempting to connect via Agent for host {host_id}")
            if not await terminal.connect_agent_ssh():
                logger.error(f"Failed to connect via Agent for host {host_id}")
                return None
                
            logger.info(f"Successfully connected via Agent for host {host_id}")
            await websocket.send_text(f"已通过Agent连接到主机 {host.name or host_id}\r\n")
            return terminal
            
        else:
            # 使用直连SSH
            logger.info(f"使用直连SSH连接主机 {host_id}")
            terminal = SSHTerminal(host, websocket, session_id)
            
            # 建立SSH连接
            if not await terminal.connect_ssh():
                return None
                
            return terminal
    
    async def _handle_websocket_messages(self, websocket: WebSocket, terminal):
        """处理WebSocket消息循环"""
        try:
            while True:
                # 接收WebSocket消息，支持文本和二进制数据
                try:
                    message = await websocket.receive()
                    if message['type'] == 'websocket.receive':
                        if 'bytes' in message:
                            data = message['bytes']
                        elif 'text' in message:
                            data = message['text'].encode('utf-8')
                        else:
                            continue
                    else:
                        continue
                except Exception as e:
                    logger.error(f"Failed to receive WebSocket message: {e}")
                    break
                
                # 处理心跳包
                if len(data) == 1 and data[0] == 0:
                    await websocket.send_bytes(b'\x00')
                    continue
                
                # 处理终端大小调整
                if (len(data) > 3 and 
                    data[0] == 0x1b and data[1] == ord('[') and data[2] == ord('8')):
                    try:
                        dims = data[4:].decode('utf-8').split(',')
                        if len(dims) == 2:
                            rows, cols = int(dims[0]), int(dims[1])
                            await terminal.resize_terminal(rows, cols)
                        continue
                    except (ValueError, UnicodeDecodeError):
                        pass
                
                # 发送输入到SSH
                await terminal.send_input(data)
                
        except Exception as e:
            logger.error(f"WebSocket处理错误: {e}")
            try:
                await websocket.send_text(f"会话错误: {str(e)}")
            except:
                pass
    
    async def _cleanup_resources(self, terminal, output_task, stderr_task, session_id: str):
        """清理资源"""
        # 清理任务（仅直连SSH需要）
        if output_task:
            output_task.cancel()
        if stderr_task:
            stderr_task.cancel()
        
        # 关闭终端连接
        if terminal:
            terminal.close()
        
        # 断开连接管理器
        manager.disconnect(session_id)


