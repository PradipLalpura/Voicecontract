import uvicorn
import os
import sys
from dotenv import load_dotenv

# Load environment variables from the root .env file
load_dotenv()

# Add the root directory to the python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    print("🚀 Initializing VoiceContract Backend [Pristine Architecture]...")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
