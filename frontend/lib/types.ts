export interface CompanyDetails {
  companyName: string;
  yourName: string;
  gstNumber: string;
  address: string;
  logo?: string; // base64 string
  brandDna?: string; // Text from their brand document
}

export interface Gap {
  field: string;
  warning: string;
  default_value: string;
}

export interface DealTerms {
  deliverables: string | null;
  price: string | null;
  timeline: string | null;
  payment_schedule: string | null;
  revisions: string | null;
  ip_ownership: string | null;
  confidentiality: string | null;
  dispute_resolution: string | null;
  client_name: string | null;
}

export type ProcessingState = 'waiting' | 'active' | 'done' | 'error';

export interface Step {
  id: number;
  title: string;
  subtitle: string;
  state: ProcessingState;
}
