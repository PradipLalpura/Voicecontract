import os
import subprocess
from dotenv import load_dotenv

def main():
    # Load environment variables
    load_dotenv('backend/.env')
    token = os.getenv('GITHUB_TOKEN')
    
    if not token:
        print("ERROR: GITHUB_TOKEN not found in backend/.env")
        return

    repo_url = f"https://{token}@github.com/PradipLalpura/voicecontract.git"

    print("Staging files...")
    subprocess.run(["git", "add", "."])

    print("Committing Phase 2 and CI/CD...")
    subprocess.run(["git", "commit", "-m", "Phase 2: Frontend complete & CI/CD pipeline added"])

    print("Setting remote origin...")
    subprocess.run(["git", "remote", "remove", "origin"], capture_output=True) # Ignore error if doesn't exist
    subprocess.run(["git", "remote", "add", "origin", repo_url])

    print("Pushing to GitHub...")
    result = subprocess.run(["git", "push", "-u", "origin", "main"], capture_output=True, text=True)
    
    if result.returncode == 0:
        print("Successfully pushed to GitHub!")
        print(result.stdout)
    else:
        print("Push failed:")
        print(result.stderr)

if __name__ == "__main__":
    main()
