from fastapi import APIRouter, WebSocket, Depends

from app.services.terminal_service import TerminalService

router = APIRouter(prefix="/hosts", tags=["terminal"])


@router.websocket("/{host_id}/terminal")
async def terminal_websocket(
    websocket: WebSocket, 
    host_id: int,
    terminal_service: TerminalService = Depends(TerminalService)
):
    """WebShell终端WebSocket接口 - 支持直连SSH和Agent连接"""
    await terminal_service.handle_terminal_websocket(websocket, host_id)