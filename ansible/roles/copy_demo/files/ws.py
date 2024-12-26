from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import asyncio
import subprocess

app = FastAPI()
tasks = {}

class Task:
    def __init__(self, command):
        self.command = command
        self.output = []
        self.active_clients = []

    async def run(self):
        process = await asyncio.create_subprocess_shell(
            self.command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT
        )

        async for line in process.stdout:
            line = line.decode('utf-8').strip()
            self.output.append(line)
            # Broadcast the output line to all connected clients
            for client in self.active_clients:
                await client.send_text(line)

        await process.wait()

@app.get("/")
async def get():
    return HTMLResponse("""
    <html>
        <head>
            <title>WebSocket Example</title>
        </head>
        <body>
            <h1>WebSocket Output</h1>
            <ul id="output"></ul>
            <script>
                const outputEl = document.getElementById("output");
                const ws = new WebSocket("ws://localhost:8000/ws/task1");
                ws.onmessage = function(event) {
                    const li = document.createElement("li");
                    li.textContent = event.data;
                    outputEl.appendChild(li);
                };
            </script>
        </body>
    </html>
    """)

@app.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    await websocket.accept()
    task = tasks.get(task_id)
    if task:
        task.active_clients.append(websocket)
        # Send existing output to the new client
        for line in task.output:
            await websocket.send_text(line)
    else:
        await websocket.send_text("Task not found")
        await websocket.close()

    try:
        while True:
            await websocket.receive_text()  # keep the connection open
    except WebSocketDisconnect:
        if task:
            task.active_clients.remove(websocket)

if __name__ == "__main__":
    import uvicorn

    # 启动和管理事件循环
    async def main():
        import platform
        if platform.system() == "Windows":
            task1 = Task("ping -n 50 localhost")
        else:
            task1 = Task("ping -c 50 localhost")
        tasks["task1"] = task1

        # 开始任务
        asyncio.create_task(task1.run())
        # 启动 FastAPI 应用程序
        config = uvicorn.Config(app, host="0.0.0.0", port=8000, log_level="info", reload=True)
        server = uvicorn.Server(config)
        await server.serve()

    # 启动事件循环
    asyncio.run(main())
