from dataclasses import dataclass
from datetime import datetime
import base64
import io

from fpdf import FPDF
from PIL import Image


UNICODE_REPLACEMENTS = {
    "₹": "INR ",
    "—": "-",
    "–": "-",
    "…": "...",
    "’": "'",
    "‘": "'",
    "´": "'",
    "“": '"',
    "”": '"',
}


@dataclass(frozen=True)
class GeneratedDocument:
    content: bytes
    media_type: str
    file_extension: str


def sanitize_for_pdf(text: str) -> str:
    """
    Convert common Unicode punctuation/currency to Helvetica-safe Latin-1.
    Any remaining unsupported glyph is replaced with '?' as a final guard.
    """
    if text is None:
        text = ""
    elif not isinstance(text, str):
        text = str(text)

    for unsupported, replacement in UNICODE_REPLACEMENTS.items():
        text = text.replace(unsupported, replacement)

    return text.encode("latin-1", "replace").decode("latin-1")


def _company_value(company_details: dict, key: str, default: str = "") -> str:
    return sanitize_for_pdf(company_details.get(key, default))


class ContractPDF(FPDF):
    def header(self):
        # Header is handled in create_pdf for precise brand layout control.
        pass

    def footer(self):
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.set_text_color(120, 120, 120) 
        footer_text = (
            f"VoiceContract Professional | CONFIDENTIAL | Page {self.page_no()}/{{nb}}"
        )
        self.cell(0, 10, sanitize_for_pdf(footer_text), align="C")


def create_pdf(contract_text: str, company_details: dict) -> bytes:
    """
    Takes plain text contract and company details and generates PDF bytes using fpdf2.
    Enhanced layout with larger logos and better vertical rhythm.
    """
    raw_contract_text = contract_text or ""
    
    pdf = ContractPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()
    
    # 1. DUAL LOGO HEADER (Increased size and improved alignment)
    y_logo = 15
    logo_height = 35 # Increased from 25

    # Provider Logo (Left)
    if company_details.get('logo'):
        try:
            _, encoded = company_details.get('logo').split(",", 1)
            img_data = base64.b64decode(encoded)
            img_buf = io.BytesIO(img_data)
            # Use a slightly wider area for the logo to maintain aspect ratio
            pdf.image(img_buf, x=20, y=y_logo, h=logo_height)
        except Exception as e:
            print(f"Provider Logo Error: {e}")

    # Client Logo (Right)
    if company_details.get('client_logo'):
        try:
            _, encoded = company_details.get('client_logo').split(",", 1)
            img_data = base64.b64decode(encoded)
            img_buf = io.BytesIO(img_data)
            # Calculated X to align with right margin, giving it more space
            pdf.image(img_buf, x=145, y=y_logo, h=logo_height)
        except Exception as e:
            print(f"Client Logo Error: {e}")

    # 2. DOCUMENT TITLE
    pdf.set_font("helvetica", "B", 18) # Increased font size
    pdf.set_text_color(0, 0, 0)
    pdf.set_xy(20, y_logo + logo_height + 8)
    pdf.cell(0, 12, "MASTER SERVICE AGREEMENT", align="C", ln=True)
    
    # Horizontal separator
    pdf.set_draw_color(0, 0, 0)
    pdf.set_line_width(0.8)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(8)

    # 3. PARTY IDENTITY BLOCKS (Refined Layout)
    pdf.set_font("helvetica", "B", 10)
    pdf.set_text_color(60, 60, 60)
    
    y_blocks = pdf.get_y()
    # Left Block: Service Provider
    pdf.set_xy(20, y_blocks)
    pdf.cell(85, 5, "SERVICE PROVIDER", ln=False)
    # Right Block: Client
    pdf.set_xy(110, y_blocks)
    pdf.cell(85, 5, "CLIENT", ln=True)
    
    pdf.set_font("helvetica", "", 10)
    pdf.set_text_color(0, 0, 0)
    
    provider_name = _company_value(company_details, "company_name", "Not Provided")
    client_name = _company_value(company_details, "client_name", "Not Provided")
    
    # Row 1: Names
    pdf.set_x(20)
    pdf.cell(85, 6, provider_name.upper(), ln=False)
    pdf.set_x(110)
    pdf.cell(85, 6, client_name.upper(), ln=True)
    
    # Row 2: Signatory / GST
    pdf.set_font("helvetica", "", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.set_x(20)
    pdf.cell(85, 5, f"GST: {_company_value(company_details, 'gst_number', 'N/A')}", ln=False)
    pdf.set_x(110)
    pdf.cell(85, 5, f"Issued on: {datetime.now().strftime('%d %B %Y')}", ln=True)
    
    # Row 3: Address
    pdf.set_x(20)
    pdf.multi_cell(85, 4, _company_value(company_details, "address"), align="L")
    
    pdf.ln(12)

    # 4. CONTRACT BODY CONTENT
    pdf.set_font("helvetica", "", 11)
    pdf.set_text_color(0, 0, 0)
    
    # Global sanitize the main text once
    sanitized_contract = sanitize_for_pdf(contract_text.replace("₹", "INR "))
    
    lines = sanitized_contract.split("\n")
    for line in lines:
        line = line.strip()
        if not line:
            pdf.ln(3)
            continue
            
        # Refined section header detection
        is_section = (line[0:1].isdigit() and "." in line[0:3]) or (line.isupper() and len(line) < 60)
        
        if is_section:
            pdf.ln(5)
            pdf.set_font("helvetica", "B", 12)
            pdf.cell(0, 10, line.upper(), ln=True)
            pdf.set_font("helvetica", "", 11)
        else:
            pdf.multi_cell(0, 6, line, align="J")
            pdf.ln(1.5)

    # 5. SIGNATURE EXECUTION
    if pdf.get_y() > 220:
        pdf.add_page()
    
    pdf.ln(25)
    y_sig = pdf.get_y()
    pdf.set_draw_color(0, 0, 0)
    pdf.set_line_width(0.3)
    
    # Provider Signature
    pdf.line(20, y_sig + 20, 85, y_sig + 20)
    pdf.set_font("helvetica", "B", 10)
    pdf.set_xy(20, y_sig + 22)
    pdf.cell(65, 5, provider_name)
    pdf.set_font("helvetica", "", 9)
    pdf.set_xy(20, y_sig + 27)
    pdf.cell(65, 5, f"By: {_company_value(company_details, 'your_name', 'Authorised Signatory')}")

    # Client Signature
    pdf.line(125, y_sig + 20, 190, y_sig + 20)
    pdf.set_font("helvetica", "B", 10)
    pdf.set_xy(125, y_sig + 22)
    pdf.cell(65, 5, client_name)
    pdf.set_font("helvetica", "", 9)
    pdf.set_xy(125, y_sig + 27)
    pdf.cell(65, 5, "By: Authorised Signatory")

    try:
        return bytes(pdf.output())
    except Exception as e:
        print(f"PDF Output Error: {e}")
        return raw_contract_text.encode("utf-8", "replace")


def create_document(contract_text: str, company_details: dict) -> GeneratedDocument:
    """
    Generates a PDF when possible, otherwise returns the raw contract as text.
    """
    try:
        content = create_pdf(contract_text, company_details)
        is_pdf = content.startswith(b"%PDF")
        return GeneratedDocument(
            content=content,
            media_type="application/pdf" if is_pdf else "text/plain; charset=utf-8",
            file_extension="pdf" if is_pdf else "txt",
        )
    except Exception as e:
        print(f"PDF Generation Error: {e}")
        return GeneratedDocument(
            content=(contract_text or "").encode("utf-8", "replace"),
            media_type="text/plain; charset=utf-8",
            file_extension="txt",
        )
