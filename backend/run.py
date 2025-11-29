"""
AcneAI Backend Server
Development server using Uvicorn
"""

import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    print("🚀 Starting AcneAI Backend (Development Mode)...")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.is_development,
        log_level=settings.LOG_LEVEL.lower()
    )
