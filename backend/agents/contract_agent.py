import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# GitHub Models Token
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
ENDPOINT = "https://models.inference.ai.azure.com"
MODEL_ID = "gpt-4o-mini"

client = OpenAI(
    base_url=ENDPOINT,
    api_key=GITHUB_TOKEN,
)

def load_prompt(filename):
    path = os.path.join(os.path.dirname(__file__), "..", "..", "prompts", filename)
    with open(path, "r") as f:
        return f.read()

async def generate_contract(terms: dict, gaps: list, company_details: dict) -> dict:
    """
    Generates a legally structured contract using GPT-4o-mini via GitHub Models.
    This fulfills the 'Codex/OpenAI' requirement for the hackathon.
    """
    contract_prompt = load_prompt("contract_prompt.md")

    user_content = {
        "deal_terms": terms,
        "gaps_addressed": gaps,
        "service_provider": company_details
    }

    try:
        print(f"Calling GitHub Models ({MODEL_ID}) for contract generation...")
        response = client.chat.completions.create(
            model=MODEL_ID,
            messages=[
                {"role": "system", "content": contract_prompt},
                {"role": "user", "content": json.dumps(user_content, indent=2)}
            ],
            temperature=0.2,
            max_tokens=2500
        )
        
        if not response.choices:
            print(f"GitHub Models Empty Response: {response}")
            raise ValueError("No response choices returned from GPT-4o")

        contract_text = response.choices[0].message.content
        print(f"Successfully generated contract ({len(contract_text.split())} words)")
        
        return {
            "contract": contract_text,
            "word_count": len(contract_text.split()),
            "model": MODEL_ID
        }
    except Exception as e:
        print(f"Contract Generation Error Details: {str(e)}")
        if hasattr(e, 'response'):
            print(f"API Response: {e.response.text if hasattr(e.response, 'text') else e.response}")
        raise e
