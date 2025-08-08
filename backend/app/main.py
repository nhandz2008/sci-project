import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.main import api_router
from app.core.config import settings
from app.core.db import create_db_and_tables
from app.core.exceptions import (
    SCIException,
    format_error_response,
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}" if route.tags else route.name


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("🚀 Starting Science Competitions Insight API...")
    try:
        # Tables should exist from Alembic, but ensure availability in local dev/tests
        if settings.ENVIRONMENT != "production":
            create_db_and_tables()
            logger.info("✅ Database tables ensured (non-production)")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        # In production, you might want to exit here
        if settings.ENVIRONMENT == "production":
            raise
    yield
    # Shutdown
    logger.info("🔄 Application shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Science Competitions Insight API - A platform for discovering and managing science competitions worldwide",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=lifespan,
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.all_cors_origins,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Science Competitions Insight API"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get(f"{settings.API_V1_STR}/health")
async def api_health_check():
    """API health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}


# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


# Global exception handlers
@app.exception_handler(SCIException)
async def sci_exception_handler(_request, exc):
    """Handle custom SCI exceptions."""
    logger.error(f"SCI Exception: {exc.error_code} - {exc.message}")
    error_response = format_error_response(exc)
    return JSONResponse(status_code=exc.status_code, content=error_response)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request, exc):
    """Handle HTTP exceptions."""
    logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request, exc):
    """Handle validation errors."""
    logger.error(f"Validation Error: {exc.errors()}")
    field_errors = {}
    for err in exc.errors():
        loc = err.get("loc")
        field = loc[-1] if loc else "unknown"
        field_errors[field] = err.get("msg")
    error_response = {
        "error": {
            "type": "validation_error",
            "message": "Validation failed",
            "code": "VAL_001",
            "details": "Input validation failed. See field_errors for details.",
            "field_errors": field_errors,
        }
    }
    return JSONResponse(status_code=422, content=error_response)


@app.exception_handler(Exception)
async def general_exception_handler(_request, exc):
    """Handle general exceptions."""
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
