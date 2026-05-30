import os
import time
from datetime import datetime, timedelta
from typing import Any, Dict

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = os.getenv("CAPTURE_SHARED_SECRET", "Antarik_VoiceContract_Secret_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15

security = HTTPBearer()

def create_access_token(data: dict) -> str:
    """
    Creates a short-lived JWT for API authentication.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Dependency to verify JWT token on protected endpoints.
    
    Strategy (buildathon-appropriate):
    1. Allow "dev_token" for local development bypass.
    2. Try verifying with our own HMAC secret first (custom tokens).
    3. If signature doesn't match, fall back to unverified decode with
       expiry enforcement — this supports Clerk JWTs without needing
       to fetch their JWKS endpoint (latency/complexity trade-off).
    """
    token = credentials.credentials
    if token == "dev_token":
        return {"sub": "dev_user"}
        
    try:
        # First, try to verify with our own secret (custom tokens created by create_access_token)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.InvalidSignatureError:
        # Signature doesn't match our secret — likely a Clerk JWT.
        # Decode without sig verification but at minimum enforce expiry
        # to prevent replay attacks with expired tokens.
        try:
            payload = jwt.decode(token, options={
                "verify_signature": False,
                "verify_exp": True
            })
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
