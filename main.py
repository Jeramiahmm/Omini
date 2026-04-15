import uvicorn

from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app:create_app",
        factory=True,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.log_level.lower(),
    )
