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
    Purely professional B&W style for legal weight.
    """
    raw_contract_text = contract_text or ""
    # We do NOT sanitize yet, we want to preserve as much as possible 
    # but fpdf needs latin-1.
    
    pdf = ContractPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()
    
    # 1. DUAL LOGO HEADER
    y_start = 15
    # Provider Logo (Left)
    if company_details.get('logo'):
        try:
            _, encoded = company_details.get('logo').split(",", 1)
            img_data = base64.b64decode(encoded)
            img_buf = io.BytesIO(img_data)
            pdf.image(img_buf, x=20, y=y_start, h=18)
        except Exception as e:
            print(f"Provider Logo Error: {e}")

    # Client Logo (Right)
    if company_details.get('client_logo'):
        try:
            _, encoded = company_details.get('client_logo').split(",", 1)
            img_data = base64.b64decode(encoded)
            img_buf = io.BytesIO(img_data)
            pdf.image(img_buf, x=155, y=y_start, h=18)
        except Exception as e:
            print(f"Client Logo Error: {e}")

    # 2. DOCUMENT TITLE & IDENTITIES
    pdf.set_font("helvetica", "B", 14)
    pdf.set_text_color(0, 0, 0)
    pdf.set_xy(20, y_start + 25)
    pdf.cell(0, 10, "MASTER SERVICE AGREEMENT", align="C", ln=True)
    
    # Horizontal line (Professional Gray)
    pdf.set_draw_color(100, 100, 100)
    pdf.set_line_width(0.5)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(5)

    # Party Information Blocks
    pdf.set_font("helvetica", "B", 9)
    pdf.set_text_color(80, 80, 80)
    
    # Provider Details
    pdf.set_x(20)
    pdf.cell(85, 5, "SERVICE PROVIDER", ln=False)
    # Client Details
    pdf.set_x(110)
    pdf.cell(85, 5, "CLIENT", ln=True)
    
    pdf.set_font("helvetica", "", 9)
    pdf.set_text_color(0, 0, 0)
    
    provider_name = _company_value(company_details, "company_name", "Not Provided")
    client_name = _company_value(company_details, "client_name", "Not Provided")
    
    # Row 1
    pdf.set_x(20)
    pdf.cell(85, 5, provider_name, ln=False)
    pdf.set_x(110)
    pdf.cell(85, 5, client_name, ln=True)
    
    # Row 2 (Address/GST)
    pdf.set_font("helvetica", "", 8)
    pdf.set_text_color(100, 100, 100)
    pdf.set_x(20)
    pdf.cell(85, 4, f"GST: {_company_value(company_details, 'gst_number', 'N/A')}", ln=False)
    pdf.set_x(110)
    pdf.cell(85, 4, f"Date of Issue: {datetime.now().strftime('%d %B %Y')}", ln=True)
    
    pdf.ln(10)

    # 3. BODY CONTENT
    pdf.set_font("helvetica", "", 10.5)
    pdf.set_text_color(0, 0, 0)
    
    # Global sanitize the main text once
    sanitized_contract = sanitize_for_pdf(contract_text.replace("₹", "INR "))
    
    lines = sanitized_contract.split("\n")
    for line in lines:
        line = line.strip()
        if not line:
            pdf.ln(3)
            continue
            
        # Detect numbered sections (e.g., 1.0, 2.0) or ALL CAPS HEADERS
        is_section = (line[0:1].isdigit() and "." in line[0:3]) or (line.isupper() and len(line) < 50)
        
        if is_section:
            pdf.ln(4)
            pdf.set_font("helvetica", "B", 11)
            pdf.cell(0, 8, line.upper(), ln=True)
            pdf.set_font("helvetica", "", 10.5)
        else:
            pdf.multi_cell(0, 5.5, line, align="J")
            pdf.ln(1.5)

    # 4. SIGNATURE SECTION
    if pdf.get_y() > 230:
        pdf.add_page()
    
    pdf.ln(20)
    y_sig = pdf.get_y()
    pdf.set_draw_color(150, 150, 150)
    pdf.set_line_width(0.2)
    
    # Signature Lines
    pdf.line(20, y_sig + 20, 85, y_sig + 20)
    pdf.set_font("helvetica", "B", 9)
    pdf.set_xy(20, y_sig + 22)
    pdf.cell(65, 5, provider_name)
    pdf.set_font("helvetica", "", 8)
    pdf.set_xy(20, y_sig + 26)
    pdf.cell(65, 5, f"By: {_company_value(company_details, 'your_name', 'Authorised Signatory')}")

    pdf.line(125, y_sig + 20, 190, y_sig + 20)
    pdf.set_font("helvetica", "B", 9)
    pdf.set_xy(125, y_sig + 22)
    pdf.cell(65, 5, client_name)
    pdf.set_font("helvetica", "", 8)
    pdf.set_xy(125, y_sig + 26)
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
