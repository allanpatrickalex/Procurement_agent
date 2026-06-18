"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import contracts, dashboard, spend, supplier
from app.database.db import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Initialize application resources on startup."""
    init_db()
    logger.info("Procurement Advisor Agent API started")
    yield
    logger.info("Procurement Advisor Agent API shutting down")


app = FastAPI(
    title="Procurement Advisor Agent",
    description="Local-first AI procurement analyst for quotes, contracts, and spend.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(supplier.router, prefix="/api")
app.include_router(contracts.router, prefix="/api")
app.include_router(spend.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.get("/api/health")
def health_check() -> dict[str, str]:
    """Simple health check endpoint."""
    return {"status": "ok"}
