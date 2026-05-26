from fastapi import APIRouter, HTTPException
from models import GenerateRequest
from agents.contract_agent import generate_contract

router = APIRouter()

@router.post("/generate")
async def generate(request: GenerateRequest):
    if not request.terms:
        raise HTTPException(status_code=400, detail="Terms dictionary cannot be empty")
        
    try:
        # Convert Pydantic models to dicts for the agent
        result = await generate_contract(
            request.terms, 
            request.gaps, 
            request.company_details.model_dump()
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
