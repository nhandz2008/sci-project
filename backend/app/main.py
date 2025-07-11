from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import settings

def create_application() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    This function encapsulates the app creation logic, making it easier to test
    and configure different environments.
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="API for managing science and technology competitions",
        version="1.0.0",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )

    # Configure CORS with settings from configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include the API router
    app.include_router(api_router, prefix=settings.API_V1_STR)

    return app

# Create the FastAPI app instance
app = create_application() 