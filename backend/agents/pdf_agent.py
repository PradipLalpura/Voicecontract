import pdfkit
from datetime import datetime

def create_pdf(contract_text: str, company_details: dict) -> bytes:
    """
    Takes plain text contract and company details, formats as HTML, 
    and generates PDF bytes using pdfkit.
    """
    
    # Very basic markdown-to-html conversion for sections
    html_body = contract_text.replace("\n\n", "</p><p>").replace("\n", "<br>")
    
    # We apply strong CSS styling for a professional look
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Helvetica', 'Arial', sans-serif; line-height: 1.6; margin: 40px; color: #333; }}
            .header {{ text-align: center; border-bottom: 2px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; }}
            .header h1 {{ margin: 0; color: #111; }}
            .company-name {{ font-size: 24px; font-weight: bold; color: #22c55e; }}
            .footer {{ position: fixed; bottom: 20px; width: 100%; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }}
            p {{ margin-bottom: 15px; }}
            strong {{ color: #111; }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">{company_details.get('company_name', 'Service Provider')}</div>
            <h1>SERVICE AGREEMENT</h1>
            <div>Date: {datetime.now().strftime('%B %d, %Y')}</div>
            <div>GST: {company_details.get('gst_number', 'N/A')}</div>
        </div>
        
        <div class="content">
            <p>{html_body}</p>
        </div>
    </body>
    </html>
    """

    options = {
        'page-size': 'A4',
        'margin-top': '0.75in',
        'margin-right': '0.75in',
        'margin-bottom': '1.0in',
        'margin-left': '0.75in',
        'encoding': "UTF-8",
        'no-outline': None,
        'enable-local-file-access': None
    }

    try:
        # Assuming wkhtmltopdf is installed on the system
        pdf_bytes = pdfkit.from_string(html_content, False, options=options)
        return pdf_bytes
    except Exception as e:
        print(f"PDF Generation Error: {str(e)}")
        raise e
