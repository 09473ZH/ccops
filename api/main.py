import uvicorn
from app.main import app


def main():
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8003,
        reload=True,
    )


if __name__ == "__main__":
    main()
