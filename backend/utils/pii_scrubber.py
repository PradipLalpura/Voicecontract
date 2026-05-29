import re
import logging

logger = logging.getLogger("voicecontract.security.pii")

# Comprehensive Regex for Indian Context & General PII
PII_PATTERNS = {
    "AADHAAR": r"\b\d{4}\s?\d{4}\s?\d{4}\b",
    "PAN": r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b",
    "CREDIT_CARD": r"\b(?:\d[ -]*?){13,16}\b",
    "EMAIL": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    "PHONE_IND": r"\b(?:\+?91[\-\s]?)?[6789]\d{9}\b",
    "BANK_ACC": r"\b\d{9,18}\b",  # Generic bank account number heuristic
    "IFSC": r"\b[A-Z]{4}0[A-Z0-9]{6}\b"
}

def scrub_transcript(text: str) -> str:
    """
    Redacts sensitive PII from transcripts before they hit external LLMs.
    Executes in-memory with near zero latency.
    """
    if not text:
        return text

    scrubbed_text = text
    matches_found = 0

    for pii_type, pattern in PII_PATTERNS.items():
        # Using a replacement function to count replacements
        def replace_match(match):
            nonlocal matches_found
            matches_found += 1
            return f"[REDACTED_{pii_type}]"
            
        scrubbed_text = re.sub(pattern, replace_match, scrubbed_text)

    if matches_found > 0:
        logger.info(f"🛡️ PII Scrubber active: Redacted {matches_found} sensitive entities from transcript chunk.")

    return scrubbed_text
