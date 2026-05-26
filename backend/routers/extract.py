from fastapi import APIRouter, HTTPException
from models import ExtractRequest
from agents.extraction_agent import process_transcript

router = APIRouter()

@router.post("/extract")
async def extract(request: ExtractRequest):
    try:
        result = await process_transcript(request.transcript)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
