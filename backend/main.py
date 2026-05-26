import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
from dotenv import load_dotenv

from routers import transcribe, extract, generate, documents

# Verify environment variables on startup
load_dotenv()
required_vars = ["GROQ_API_KEY", "GEMINI_API_KEY", "GITHUB_TOKEN"]
missing_vars = [var for var in required_vars if not os.getenv(var)]
if missing_vars:
    print(f"WARNING: Missing environment variables: {', '.join(missing_vars)}")

app = FastAPI(title="VoiceContract API", version="1.0.0")

# CORS Security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": str(exc)},
    )

# Routers
app.include_router(transcribe.router, prefix="/api", tags=["Audio"])
app.include_router(extract.router, prefix="/api", tags=["Analysis"])
app.include_router(generate.router, prefix="/api", tags=["Generation"])
app.include_router(documents.router, prefix="/api", tags=["Documents"])

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "version": "1.0.0", 
        "timestamp": datetime.now().isoformat()
    }
