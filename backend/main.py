from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from logger import logger

# Create FastAPI app
app = FastAPI(
    title="AI Knowledge Inbox API",
    description="A minimal RAG-powered knowledge management system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)

@app.on_event("startup")
async def startup_event():
    """Log startup event."""
    logger.info("AI Knowledge Inbox API started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Log shutdown event."""
    logger.info("AI Knowledge Inbox API shutting down")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
