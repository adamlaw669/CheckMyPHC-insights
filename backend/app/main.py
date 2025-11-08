"""
CheckMyPHC Insights API - Main application entry point.

A production-ready FastAPI service that serves insights data
for the CheckMyPHC frontend application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1 import endpoints

# Setup logging
logger = setup_logging(log_level=settings.LOG_LEVEL, log_file="logs/app.log")

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-ready API for CheckMyPHC Insights Engine data",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Log startup information."""
    logger.info("=" * 80)
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Output Directory: {settings.OUTPUT_DIR}")
    logger.info(f"Data Directory: {settings.DATA_DIR}")
    logger.info(f"Log Level: {settings.LOG_LEVEL}")
    logger.info(f"Debug Mode: {settings.DEBUG}")
    logger.info(f"CORS Origins: {settings.CORS_ORIGINS}")
    logger.info("=" * 80)


@app.on_event("shutdown")
async def shutdown_event():
    """Log shutdown information."""
    logger.info("Shutting down CheckMyPHC Insights API")


@app.get("/", tags=["Health"])
async def root():
    """
    Health check endpoint.

    Returns basic API information and status.
    """
    return JSONResponse(
        {
            "status": "healthy",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "docs": "/docs",
        }
    )


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Detailed health check endpoint.

    Returns service health status.
    """
    return JSONResponse(
        {
            "status": "healthy",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "timestamp": None,  # Will be set by FastAPI
        }
    )


# Include API v1 router
app.include_router(
    endpoints.router, prefix=settings.API_V1_PREFIX, tags=["Insights API v1"]
)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
