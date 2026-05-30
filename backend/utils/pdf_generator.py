import io
import json
import secrets
import logging
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor

logger = logging.getLogger("voicecontract.pdf")

def generate_locked_pdf(contract_text: str, signature_strokes: list, metadata: dict) -> bytes:
    """
    Generates a cryptographically locked PDF.
    - Embeds a visual cryptographic watermark.
    - Draws the biometric signature vector path.
    - Embeds invisible audit metadata.
    - Secures the document with a random owner password to prevent editing/copying.
    """
    buffer = io.BytesIO()
    
    # Generate a random 256-bit owner password. The user password is "", allowing viewing.
    # canModify=0 and canCopy=0 locks the document cryptographically.
    owner_pwd = secrets.token_hex(32)
    c = canvas.Canvas(buffer, pagesize=letter, encrypt=canvas.pdfencrypt.StandardEncryption(
        userPassword="", 
        ownerPassword=owner_pwd, 
        canPrint=1, 
        canModify=0, 
        canCopy=0, 
        canAnnotate=0
    ))
    
    width, height = letter

    # 1. Draw Cryptographic Watermark
    crypto_stamp = metadata.get("crypto_stamp", "UNVERIFIED")
    c.saveState()
    c.setFillColor(HexColor("#00C2CC"), alpha=0.08)
    c.setFont("Helvetica-Bold", 45)
    c.translate(width / 2, height / 2)
    c.rotate(45)
    c.drawCentredString(0, 0, f"SECURED: {crypto_stamp}")
    c.restoreState()

    # 2. Draw Contract Text
    c.setFillColor(HexColor("#0D0D0D"))
    c.setFont("Helvetica", 11)
    
    text_object = c.beginText(50, height - 50)
    text_object.setLeading(14)
    
    for line in contract_text.split('\n'):
        # Simple word wrap (approx 85 chars per line for Helvetica 11 on Letter)
        words = line.split(' ')
        current_line = ""
        for word in words:
            if len(current_line) + len(word) > 85:
                text_object.textLine(current_line)
                current_line = word + " "
                # Check for page overflow
                if text_object.getY() < 50:
                    c.drawText(text_object)
                    c.showPage()
                    text_object = c.beginText(50, height - 50)
                    text_object.setLeading(14)
            else:
                current_line += word + " "
        text_object.textLine(current_line)
        
        if text_object.getY() < 50:
            c.drawText(text_object)
            c.showPage()
            text_object = c.beginText(50, height - 50)
            text_object.setLeading(14)
            
    c.drawText(text_object)

    # 3. Draw Biometric Signature
    # If there's enough space on the current page, draw it, else new page.
    if text_object.getY() < 200:
        c.showPage()
        sig_y_offset = height - 200
    else:
        sig_y_offset = text_object.getY() - 150

    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, sig_y_offset + 120, "EXECUTED & DIGITALLY SIGNED:")
    
    # The signature is drawn within a 500x240 box in the frontend.
    # We map this to a smaller box in the PDF (e.g., 250x120)
    scale_factor = 0.5
    c.setStrokeColor(HexColor("#00C2CC"))
    c.setLineWidth(1.5)
    
    for stroke in signature_strokes:
        points = stroke.get("points", [])
        if not points:
            continue
        p = c.beginPath()
        p.moveTo(50 + (points[0]["x"] * scale_factor), sig_y_offset + 100 - (points[0]["y"] * scale_factor))
        for point in points[1:]:
            p.lineTo(50 + (point["x"] * scale_factor), sig_y_offset + 100 - (point["y"] * scale_factor))
        c.drawPath(p, stroke=1, fill=0)

    # 4. Invisible Metadata (Audit Trail)
    audit_data = json.dumps(metadata)
    c.setAuthor("VoiceContract Nexus")
    c.setTitle(f"Secured MSA - {metadata.get('session_id', 'Unknown')}")
    c.setSubject(audit_data) # Embed audit trail in Subject metadata

    # 5. Lock and Save
    c.save()
    return buffer.getvalue()
