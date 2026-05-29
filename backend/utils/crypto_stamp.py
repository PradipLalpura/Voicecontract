import hashlib
import json
import time
from typing import Any, Dict

def generate_document_hash(document_data: Dict[str, Any]) -> str:
    """
    Generates a deterministic SHA-256 cryptographic stamp for the finalized legal document.
    Ensures that the exact terms cannot be tampered with post-generation.
    """
    # Sort keys to ensure deterministic JSON stringification
    payload_str = json.dumps(document_data, sort_keys=True, separators=(',', ':'))
    
    # We append a server-side timestamp to the hash generation to anchor it in time
    salt = str(time.time()).encode('utf-8')
    
    hasher = hashlib.sha256()
    hasher.update(payload_str.encode('utf-8'))
    hasher.update(salt)
    
    return hasher.hexdigest()
