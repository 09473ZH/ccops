import asyncio
import asyncssh
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict

from app.models.host import Host
from app.models.configuration import Configuration

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
    """WebShell终端WebSocket接口"""
    session_id = f"{host_id}_{id(websocket)}"
    
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
        
        # 创建SSH终端
        terminal = SSHTerminal(host, websocket, session_id)
        
        # 建立SSH连接
        if not await terminal.connect_ssh():
            await websocket.close()
            return
        
        # 启动SSH输出处理任务
        output_task = asyncio.create_task(terminal.handle_ssh_output())
        stderr_task = asyncio.create_task(terminal.handle_ssh_stderr())
        
        try:
            while True:
                # 接收WebSocket消息
                data = await websocket.receive_bytes()
                
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
            await websocket.send_text(f"会话错误: {str(e)}")
        finally:
            # 清理任务
            output_task.cancel()
            stderr_task.cancel()
            terminal.close()
            
    except Exception as e:
        logger.error(f"WebSocket连接失败: {e}")
    finally:
        manager.disconnect(session_id)