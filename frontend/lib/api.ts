import { CompanyDetails, DealTerms, Gap } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function transcribeAudio(file: File): Promise<{ transcript: string, duration: number }> {
  const formData = new FormData();
  formData.append('audio_file', file);
  
  const response = await fetch(`${API_URL}/api/transcribe`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to transcribe audio');
  }
  
  return response.json();
}

export async function extractTerms(transcript: string): Promise<{ terms: DealTerms, gaps: Gap[], has_gaps: boolean }> {
  const response = await fetch(`${API_URL}/api/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to extract terms');
  }
  
  return response.json();
}

export async function generateContract(terms: DealTerms, gaps: Gap[], companyDetails: CompanyDetails): Promise<{ contract: string }> {
  const response = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      terms, 
      gaps, 
      company_details: {
        company_name: companyDetails.companyName,
        your_name: companyDetails.yourName,
        gst_number: companyDetails.gstNumber,
        address: companyDetails.address,
        logo: companyDetails.logo,
        client_logo: companyDetails.clientLogo,
        client_name: companyDetails.clientName,
        brand_dna: companyDetails.brandDna
      } 
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to generate contract');
  }
  
  return response.json();
}

export async function downloadPDF(contract: string, companyDetails: CompanyDetails): Promise<void> {
  const response = await fetch(`${API_URL}/api/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      contract, 
      company_details: {
        company_name: companyDetails.companyName,
        your_name: companyDetails.yourName,
        gst_number: companyDetails.gstNumber,
        address: companyDetails.address,
        logo: companyDetails.logo,
        client_logo: companyDetails.clientLogo,
        client_name: companyDetails.clientName,
        brand_dna: companyDetails.brandDna
      } 
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to generate PDF');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `VoiceContract_${new Date().getTime()}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}
