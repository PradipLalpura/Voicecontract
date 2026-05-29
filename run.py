import uvicorn
import os
import sys

# Add the root directory to the python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    print("🚀 Initializing VoiceContract Pro Backend [Pristine Architecture]...")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
