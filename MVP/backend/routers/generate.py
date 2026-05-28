from fastapi import APIRouter, HTTPException
from models import GenerateRequest
from agents.contract_agent import generate_contract

router = APIRouter()

@router.post("/generate")
async def generate(request: GenerateRequest):
    # Even if terms are empty, we can try to generate a boilerplate contract
    # but we'll log it.
    if not request.terms and not request.gaps:
        raise HTTPException(status_code=400, detail="No data provided for contract generation.")
        
    try:
        # Convert Pydantic models to dicts for the agent
        result = await generate_contract(
            request.terms or {}, 
            request.gaps or [], 
            request.company_details.model_dump()
        )
        return result
    except Exception as e:
        print(f"Generate Route Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
