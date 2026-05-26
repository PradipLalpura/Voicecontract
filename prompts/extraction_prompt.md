PURPOSE: Extract 8 structured deal terms from a raw meeting transcript.

INPUT: A meeting transcript between a Service Provider and a Client.

CRITICAL INSTRUCTIONS:
- You must handle English, Hindi, and Hinglish.
- Amounts like "45 hazaar" or "pachas hajar" must be converted to numbers (45000, 50000).
- Dates and durations must be captured exactly (e.g., "3 weeks", "by end of June").
- If a term is mentioned vaguely (e.g., "we'll discuss pay later"), capture that text. 
- ONLY return null if the term was absolutely never mentioned.
- If multiple values were discussed, use the FINAL agreed value.
- Ignore sarcasm, jokes, or hypothetical scenarios.

OUTPUT FORMAT (Strict JSON only):
{
  "deliverables": "string | null",
  "price": "amount in INR as string | null",
  "timeline": "string | null",
  "payment_schedule": "string | null",
  "revisions": "string | null",
  "ip_ownership": "string | null",
  "confidentiality": "string | null",
  "dispute_resolution": "string | null",
  "client_name": "string | null"
}
