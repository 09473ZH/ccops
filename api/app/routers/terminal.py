import asyncio
import asyncssh
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict

from app.models.host import Host
from app.models.configuration import Configuration
from app.services.agent_manager import agent_manager

router = APIRouter(prefix="/hosts", tags=["terminal"])

logger = logging.getLogger(__name__)

# WebSocket连接管理
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.ssh_sessions: Dict[str, asyncssh.SSHClientSession] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if session_id in self.ssh_sessions:
            if self.ssh_sessions[session_id]:
                self.ssh_sessions[session_id].close()
            del self.ssh_sessions[session_id]

    async def send_message(self, session_id: str, message: str):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_text(message)

manager = ConnectionManager()


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


manager = ConnectionManager()


class SSHTerminal:
    def __init__(self, host: Host, websocket: WebSocket, session_id: str):
        self.host = host
        self.websocket = websocket
        self.session_id = session_id
        self.ssh_conn = None
        self.ssh_process = None

    async def connect_ssh(self):
        """建立SSH连接"""
        try:
            # 获取私钥配置
            private_key_config = await Configuration.filter(field_name="PrivateKey").first()
            if not private_key_config or not private_key_config.field_value:
                await self.websocket.send_text("错误: 未找到私钥配置")
                return False

            # 创建SSH连接
            self.ssh_conn = await asyncssh.connect(
                self.host.host_server_url,
                port=22,
                username='root',
                client_keys=[asyncssh.import_private_key(private_key_config.field_value)],
                known_hosts=None,
                connect_timeout=10.0
            )
            
            # 创建交互式shell
            self.ssh_process = await self.ssh_conn.create_process(
                term_type='xterm',
                term_size=(40, 120),
                encoding=None  # 使用二进制模式处理数据
            )
            
            return True
            
        except Exception as e:
            logger.error(f"SSH连接失败: {str(e)}")
            await self.websocket.send_text(f"SSH连接失败: {str(e)}")
            return False

    async def handle_ssh_output(self):
        """处理SSH输出"""
        try:
            while not self.ssh_process.stdout.at_eof():
                data = await self.ssh_process.stdout.read(4096)
                if data:
                    # 清理UTF-8数据
                    try:
                        text = data.decode('utf-8', errors='replace')
                        await self.websocket.send_text(text)
                    except Exception as e:
                        logger.warning(f"输出编码错误: {e}")
                        await self.websocket.send_text(data.decode('utf-8', errors='ignore'))
        except Exception as e:
            logger.error(f"处理SSH输出失败: {e}")
            if self.websocket.client_state != WebSocket.CLOSED:
                await self.websocket.send_text(f"输出处理错误: {str(e)}")

    async def handle_ssh_stderr(self):
        """处理SSH错误输出"""
        try:
            while not self.ssh_process.stderr.at_eof():
                data = await self.ssh_process.stderr.read(4096)
                if data:
                    try:
                        text = data.decode('utf-8', errors='replace')
                        await self.websocket.send_text(text)
                    except Exception as e:
                        logger.warning(f"错误输出编码错误: {e}")
                        await self.websocket.send_text(data.decode('utf-8', errors='ignore'))
        except Exception as e:
            logger.error(f"处理SSH错误输出失败: {e}")

    async def send_input(self, data: bytes):
        """发送输入到SSH"""
        try:
            if self.ssh_process and self.ssh_process.stdin:
                self.ssh_process.stdin.write(data)
                await self.ssh_process.stdin.drain()
        except Exception as e:
            logger.error(f"发送输入失败: {e}")
            await self.websocket.send_text(f"输入发送错误: {str(e)}")

    async def resize_terminal(self, rows: int, cols: int):
        """调整终端大小"""
        try:
            if self.ssh_process:
                self.ssh_process.change_terminal_size(cols, rows)
        except Exception as e:
            logger.warning(f"调整终端大小失败: {e}")

    def close(self):
        """关闭SSH连接"""
        try:
            if self.ssh_process:
                self.ssh_process.terminate()
            if self.ssh_conn:
                self.ssh_conn.close()
        except Exception as e:
            logger.error(f"关闭SSH连接失败: {e}")


@router.websocket("/{host_id}/terminal")
async def terminal_websocket(websocket: WebSocket, host_id: int):
    """WebShell终端WebSocket接口 - 支持直连SSH和Agent连接"""
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
                await websocket.close()
                return
                
            logger.info(f"Successfully connected via Agent for host {host_id}")
            await websocket.send_text(f"已通过Agent连接到主机 {host.name or host_id}\r\n")
            
        else:
            # 使用直连SSH
            logger.info(f"使用直连SSH连接主机 {host_id}")
            terminal = SSHTerminal(host, websocket, session_id)
            
            # 建立SSH连接
            if not await terminal.connect_ssh():
                await websocket.close()
                return
            
            # 启动SSH输出处理任务（仅直连SSH需要）
            output_task = asyncio.create_task(terminal.handle_ssh_output())
            stderr_task = asyncio.create_task(terminal.handle_ssh_stderr())
        
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
                
        except WebSocketDisconnect:
            logger.info(f"WebSocket连接断开: {session_id}")
        except Exception as e:
            logger.error(f"WebSocket处理错误: {e}")
            try:
                await websocket.send_text(f"会话错误: {str(e)}")
            except:
                pass
        finally:
            # 清理任务（仅直连SSH需要）
            if output_task:
                output_task.cancel()
            if stderr_task:
                stderr_task.cancel()
            
            # 关闭终端连接
            if terminal:
                terminal.close()
            
    except Exception as e:
        logger.error(f"WebSocket连接失败: {e}")
    finally:
        manager.disconnect(session_id)