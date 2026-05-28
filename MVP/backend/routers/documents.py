from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from models import PDFRequest
from agents.pdf_agent import create_document
from datetime import datetime

router = APIRouter()

@router.post("/pdf")
async def generate_pdf(request: PDFRequest):
    try:
        document = create_document(
            request.contract, 
            request.company_details.model_dump()
        )
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        return Response(
            content=document.content,
            media_type=document.media_type,
            headers={
                "Content-Disposition": f'attachment; filename="voicecontract_{timestamp}.{document.file_extension}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
