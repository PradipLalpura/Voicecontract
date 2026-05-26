from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from models import PDFRequest
from agents.pdf_agent import create_pdf
from datetime import datetime

router = APIRouter()

@router.post("/pdf")
async def generate_pdf(request: PDFRequest):
    try:
        pdf_bytes = create_pdf(
            request.contract, 
            request.company_details.model_dump()
        )
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="voicecontract_{timestamp}.pdf"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
