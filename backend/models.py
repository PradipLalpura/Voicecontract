from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

class ExtractRequest(BaseModel):
    transcript: str = Field(..., min_length=10, description="The raw meeting transcript to extract from.")

class CompanyDetails(BaseModel):
    company_name: Optional[str] = "Service Provider"
    your_name: Optional[str] = "Authorised Representative"
    gst_number: Optional[str] = "Not provided"
    address: Optional[str] = "Not provided"
    logo: Optional[str] = None # Base64 encoded logo
    brand_dna: Optional[str] = None # Text from brand document

class GenerateRequest(BaseModel):
    # Making these Optional with default values to prevent 422 errors
    # The agent will handle normalization if they are missing
    terms: Optional[Dict[str, Any]] = Field(default_factory=dict)
    gaps: Optional[List[Any]] = Field(default_factory=list)
    company_details: Optional[CompanyDetails] = Field(default_factory=lambda: CompanyDetails())

class PDFRequest(BaseModel):
    contract: str
    company_details: CompanyDetails
