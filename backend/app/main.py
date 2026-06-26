"""FastAPI application entry point."""

import logging
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import contracts, dashboard, spend, supplier, reports
from app.api.auth import router as auth_router
from app.api.savings import router as savings_router
from app.api.renewals import router as renewals_router, notifications_router
from app.api.chat import router as chat_router
from app.api.negotiation import router as negotiation_router
from app.database.db import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


def _validate_env() -> None:
    """Fail fast if required environment variables are missing."""
    missing = []
    if not os.getenv("GEMINI_API_KEY"):
        missing.append("GEMINI_API_KEY")
    if missing:
        logger.error("Missing required environment variables: %s", ", ".join(missing))
        logger.error("Copy .env.example to .env and fill in the values.")
        sys.exit(1)

    jwt_secret = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
    if jwt_secret == "dev-secret-change-in-production":
        logger.warning("JWT_SECRET is using the default dev value — set a strong secret for production")

    require_auth = os.getenv("REQUIRE_AUTH", "false").lower() in {"1", "true", "yes"}
    if not require_auth:
        logger.info("Auth is OPTIONAL (REQUIRE_AUTH=false). All requests use dev org #1.")


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Initialize application resources on startup."""
    _validate_env()
    init_db()
    logger.info("Procurement Advisor API started — /api/health for status, /docs for API reference")
    yield
    logger.info("Procurement Advisor API shutting down")


app = FastAPI(
    title="Procurement Advisor Agent",
    description="AI-powered procurement analytics: supplier quotes, contract risk, spend optimization, negotiation, and more.",
    version="2.0.0",
    lifespan=lifespan,
)

_allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core analysis routes
app.include_router(supplier.router, prefix="/api")
app.include_router(contracts.router, prefix="/api")
app.include_router(spend.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

# Phase 1: Auth
app.include_router(auth_router, prefix="/api")

# Phase 2: Savings tracker
app.include_router(savings_router, prefix="/api")

# Phase 3: Renewals + notifications
app.include_router(renewals_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")

# Phase 4: Procurement Copilot
app.include_router(chat_router, prefix="/api")

# Phase 5: Sourcing / negotiation / RFP
app.include_router(negotiation_router, prefix="/api")


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "version": "2.0.0"}
