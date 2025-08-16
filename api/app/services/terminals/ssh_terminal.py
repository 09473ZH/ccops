import asyncssh
import logging
from fastapi import WebSocket

from app.models.host import Host
from app.models.configuration import Configuration

logger = logging.getLogger(__name__)


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