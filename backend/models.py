from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

class ExtractRequest(BaseModel):
    transcript: str = Field(..., min_length=50, description="The raw meeting transcript to extract from.")

class CompanyDetails(BaseModel):
    company_name: str
    your_name: str
    gst_number: str
    address: str

class GenerateRequest(BaseModel):
    terms: Dict[str, Any]
    gaps: List[Dict[str, str]]
    company_details: CompanyDetails

class PDFRequest(BaseModel):
    contract: str
    company_details: CompanyDetails
