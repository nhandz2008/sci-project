from contextlib import asynccontextmanager
from typing import AsyncGenerator
import subprocess
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware as StarletteCORSMiddleware

from app.api.main import api_router
from app.core.config import settings
from app.core.db import init_db
from sqlmodel import Session, create_engine


def custom_generate_unique_id(route: APIRoute) -> str:
    """Generate unique ID for OpenAPI documentation"""
    return f"{route.tags[0]}-{route.name}" if route.tags else route.name


def run_migrations():
    """Run database migrations"""
    try:
        print("🔄 Running database migrations...")
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            cwd="/app"
        )
        if result.returncode == 0:
            print("✅ Database migrations completed successfully")
        else:
            print(f"❌ Migration failed: {result.stderr}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Failed to run migrations: {e}")
        sys.exit(1)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan events for FastAPI application"""
    # Startup
    print("🚀 Starting SCI API...")
    
    # Run migrations first
    run_migrations()
    
    # Initialize database with admin user
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    with Session(engine) as session:
        init_db(session)
    
    print("✅ Database initialized successfully")
    print("✅ Admin user created/verified")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down SCI API...")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Science Competitions Insight API - A platform for discovering and managing science competitions worldwide",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=lifespan,
)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        StarletteCORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Root endpoint
@app.get("/")
def root() -> dict:
    """Root endpoint with API information"""
    return {
        "message": "Welcome to Science Competitions Insight API",
        "version": "1.0.0",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": f"{settings.API_V1_STR}/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
