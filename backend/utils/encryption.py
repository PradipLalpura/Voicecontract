import os
import base64
import hashlib
from cryptography.fernet import Fernet
import logging

logger = logging.getLogger("voicecontract.encryption")

class SecurityService:
    def __init__(self):
        secret = os.getenv("CAPTURE_SHARED_SECRET", "")
        if not secret:
            logger.warning("CAPTURE_SHARED_SECRET is not set. Using a fallback key for development only.")
            secret = "Antarik_VoiceContract_Secret_2026_Fallback_Key"
            
        # Fernet requires a 32-byte url-safe base64-encoded key.
        # We hash the secret to 32 bytes and encode it.
        key = hashlib.sha256(secret.encode()).digest()
        self.fernet = Fernet(base64.urlsafe_b64encode(key))

    def encrypt(self, payload: str) -> str:
        """Encrypts a string payload into a Fernet token."""
        try:
            return self.fernet.encrypt(payload.encode("utf-8")).decode("utf-8")
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise

    def decrypt(self, encrypted_payload: str) -> str:
        """Decrypts a Fernet token back into a string payload."""
        try:
            return self.fernet.decrypt(encrypted_payload.encode("utf-8")).decode("utf-8")
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise

security_service = SecurityService()
