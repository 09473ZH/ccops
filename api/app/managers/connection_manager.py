import asyncssh
from fastapi import WebSocket
from typing import Dict


class ConnectionManager:
    """WebSocket连接管理器"""
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


# 全局连接管理器实例
manager = ConnectionManager()