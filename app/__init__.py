from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import routes


def create_app() -> FastAPI:
    app = FastAPI(
        title="Omini",
        description="Route optimization and dispatch for trash collection",
        version="0.1.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(routes.router, prefix="/api")

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app
