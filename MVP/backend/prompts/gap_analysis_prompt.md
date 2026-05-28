PURPOSE: Analyze extracted deal terms, identify missing critical terms (Gaps), and suggest standard Indian freelance defaults.

INPUT: JSON object of extracted terms.

TASK:
For every null or vague field, generate a "warning" and a "default_value".

INDIAN FREELANCE DEFAULTS:
- payment_schedule: "50% advance before work begins, 50% on final delivery"
- ip_ownership: "Client owns all work and source files upon receipt of full payment"
- revisions: "2 rounds of revisions included. Additional revisions at ₹500 per hour"
- dispute_resolution: "Resolution through mutual discussion. Governed by Indian Contract Act, 1872. Jurisdiction: Service Provider's City."
- confidentiality: "Project details and pricing kept confidential for 2 years."
- timeline: "To be mutually agreed in writing within 3 days of signing."
- deliverables: "To be detailed in a separate Scope of Work document."
- price: "To be mutually agreed and documented before work begins."

OUTPUT FORMAT (Strict JSON only):
{
  "gaps": [
    {
      "field": "field_name",
      "warning": "Conversational explanation of why this missing term matters.",
      "default_value": "The specific Indian standard default listed above."
    }
  ],
  "has_gaps": true/false,
  "gap_count": number
}
